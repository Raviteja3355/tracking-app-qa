#!/usr/bin/env bash
# =============================================================================
# post-apply-qa.sh - Phase 2: Post-Terraform Kubernetes setup for QA
#
# Run this ONCE after:
#   TG_ENV=qa terragrunt apply
#
# It installs:
#   - AWS Load Balancer Controller
#   - Cluster Autoscaler
#
# into the EKS cluster, then verifies everything is healthy.
#
# Prerequisites:
#   aws        >= 2.x
#   terraform  >= 1.5
#   terragrunt >= 0.50
#   kubectl    1.31
#   helm       >= 3.x
#   jq
#
# Usage:
#   cd devops_external_collaboration/tracking-app
#   chmod +x post-apply-qa.sh
#   ./post-apply-qa.sh
#
# Skip a step if already installed:
#   ./post-apply-qa.sh --skip-controller
#   ./post-apply-qa.sh --skip-autoscaler
#   ./post-apply-qa.sh --skip-controller --skip-autoscaler
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Args
# -----------------------------------------------------------------------------
SKIP_CONTROLLER=false
SKIP_AUTOSCALER=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-controller)
      SKIP_CONTROLLER=true
      shift
      ;;
    --skip-autoscaler)
      SKIP_AUTOSCALER=true
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# -----------------------------------------------------------------------------
# Colour helpers
# -----------------------------------------------------------------------------
STEP_COLOR="\033[1;36m"
OK_COLOR="\033[1;32m"
WARN_COLOR="\033[1;33m"
ERR_COLOR="\033[1;31m"
NC="\033[0m"

step() {
  echo -e "\n${STEP_COLOR}==> $1${NC}"
}

ok() {
  echo -e "    ${OK_COLOR}✓ $1${NC}"
}

warn() {
  echo -e "    ${WARN_COLOR}! $1${NC}"
}

fail() {
  echo -e "${ERR_COLOR}ERROR: $1${NC}"
  exit 1
}

# -----------------------------------------------------------------------------
# Prerequisites check
# -----------------------------------------------------------------------------
step "Checking prerequisites"

for tool in aws kubectl helm jq; do
  if command -v "$tool" >/dev/null 2>&1; then
    ok "$tool found: $(command -v "$tool")"
  else
    fail "$tool is not installed or not on PATH"
  fi
done

# terragrunt is optional — if absent the script falls back to reading S3 state
if command -v terragrunt >/dev/null 2>&1; then
  ok "terragrunt found: $(command -v terragrunt)"
else
  warn "terragrunt not found — will fall back to S3 state file"
fi

# -----------------------------------------------------------------------------
# AWS account guard
# -----------------------------------------------------------------------------
EXPECTED_ACCOUNT="${EXPECTED_ACCOUNT}"

step "Verifying AWS credentials (expected account: $EXPECTED_ACCOUNT)"

CALLER_JSON=$(aws sts get-caller-identity --output json)
ACTUAL_ACCOUNT=$(echo "$CALLER_JSON" | jq -r '.Account')

if [[ "$ACTUAL_ACCOUNT" != "$EXPECTED_ACCOUNT" ]]; then
  fail "Wrong AWS account. Expected $EXPECTED_ACCOUNT, got $ACTUAL_ACCOUNT

Run:
  aws configure --profile uniuni-qa
  export AWS_PROFILE=uniuni-qa"
fi

CALLER_ARN=$(echo "$CALLER_JSON" | jq -r '.Arn')

ok "Account verified: $ACTUAL_ACCOUNT"
echo "    Caller: $CALLER_ARN"

# -----------------------------------------------------------------------------
# Read Terragrunt outputs
# -----------------------------------------------------------------------------
step "Reading outputs (TG_ENV=qa)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Only cd into the script directory if terragrunt.hcl exists there
# (i.e. running from infra repo). If running from app repo (.circleci/scripts/)
# terragrunt output will fail and the script falls back to S3 state automatically.
if [[ -f "${SCRIPT_DIR}/terragrunt.hcl" ]]; then
  cd "$SCRIPT_DIR"
fi

export TG_ENV=qa

echo "    Trying: terragrunt output -json ..."

set +e
TF_RAW=$(terragrunt output -json 2>/dev/null)
TG_EXIT=$?
set -e

if [[ $TG_EXIT -eq 0 ]] && echo "$TF_RAW" | jq empty >/dev/null 2>&1; then
  TF="$TF_RAW"
  ok "Terragrunt output succeeded."
else
  warn "terragrunt output failed. Falling back to S3 state file..."

  STATE_BUCKET="${STATE_BUCKET}"
  STATE_KEY="${STATE_KEY}"
  STATE_REGION="${STATE_REGION}"

  echo "    Reading: s3://$STATE_BUCKET/$STATE_KEY"

  set +e
  STATE_RAW=$(aws s3 cp "s3://$STATE_BUCKET/$STATE_KEY" - --region "$STATE_REGION")
  S3_EXIT=$?
  set -e

  if [[ $S3_EXIT -ne 0 ]]; then
    fail "Could not read state from S3.
Ensure terragrunt apply ran and the state file exists."
  fi

  TF=$(echo "$STATE_RAW" | jq '
    .outputs
    | with_entries({ key: .key, value: { value: .value.value } })
  ')

  ok "S3 state read succeeded."
fi

# -----------------------------------------------------------------------------
# Helper to read outputs
# -----------------------------------------------------------------------------
get_tf_output() {
  local key="$1"

  local value
  value=$(echo "$TF" | jq -r --arg k "$key" '.[$k].value // empty')

  if [[ -z "$value" || "$value" == "null" ]]; then
    fail "Output '$key' not found.
Verify terragrunt apply completed successfully."
  fi

  echo "$value"
}

# -----------------------------------------------------------------------------
# Load outputs
# -----------------------------------------------------------------------------
CLUSTER=$(get_tf_output "eks_cluster_name")
VPC_ID=$(get_tf_output "vpc_id")
ALB_ROLE_ARN=$(get_tf_output "alb_controller_role_arn")
AUTOSCALER_ROLE_ARN=$(get_tf_output "cluster_autoscaler_role_arn")
ALB_DNS=$(get_tf_output "alb_dns_name")
ECR_URL=$(get_tf_output "ecr_repository_url")
TG_ARN=$(get_tf_output "target_group_arn")

# Derive region from ECR URL
# Format:
#   <account>.dkr.ecr.<region>.amazonaws.com/repo
REGION=$(echo "$ECR_URL" | cut -d'.' -f4)

if [[ -z "$REGION" ]]; then
  REGION="${STATE_REGION}"
fi

echo ""
printf "    %-30s %s\n" "EKS cluster:" "$CLUSTER"
printf "    %-30s %s\n" "Region:" "$REGION"
printf "    %-30s %s\n" "VPC ID:" "$VPC_ID"
printf "    %-30s %s\n" "ECR URL:" "$ECR_URL"
printf "    %-30s %s\n" "ALB DNS:" "$ALB_DNS"
printf "    %-30s %s\n" "Target group ARN:" "$TG_ARN"
printf "    %-30s %s\n" "ALB controller role:" "$ALB_ROLE_ARN"
printf "    %-30s %s\n" "Autoscaler role:" "$AUTOSCALER_ROLE_ARN"

# -----------------------------------------------------------------------------
# Step 1 - kubeconfig
# -----------------------------------------------------------------------------
step "Updating kubeconfig for cluster: $CLUSTER"

aws eks update-kubeconfig \
  --name "$CLUSTER" \
  --region "$REGION"

step "Waiting for nodes to be Ready (up to 5 minutes)"

kubectl wait node \
  --all \
  --for=condition=Ready \
  --timeout=300s

kubectl get nodes

# -----------------------------------------------------------------------------
# Step 2 - AWS Load Balancer Controller
# -----------------------------------------------------------------------------
if [[ "$SKIP_CONTROLLER" == true ]]; then
  warn "Skipping AWS Load Balancer Controller (--skip-controller)"
else
  step "Installing/upgrading AWS Load Balancer Controller (v1.10.0)"

helm repo add eks https://aws.github.io/eks-charts >/dev/null 2>&1 || true
helm repo update eks

helm upgrade --install aws-load-balancer-controller \
  eks/aws-load-balancer-controller \
  --namespace kube-system \
  --version 1.10.0 \
  --set clusterName="$CLUSTER" \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="$ALB_ROLE_ARN" \
  --set region="$REGION" \
  --set vpcId="$VPC_ID" \
  --wait \
  --timeout=5m

  step "Verifying ALB Controller rollout"

  kubectl rollout status deployment/aws-load-balancer-controller \
    -n kube-system \
    --timeout=180s

  ok "AWS Load Balancer Controller is Ready"
fi

# -----------------------------------------------------------------------------
# Step 3 - Cluster Autoscaler
# -----------------------------------------------------------------------------
if [[ "$SKIP_AUTOSCALER" == true ]]; then
  warn "Skipping Cluster Autoscaler (--skip-autoscaler)"
else
  step "Installing/upgrading Cluster Autoscaler"

  helm repo add autoscaler https://kubernetes.github.io/autoscaler >/dev/null 2>&1 || true
  helm repo update autoscaler

  helm upgrade --install cluster-autoscaler \
    autoscaler/cluster-autoscaler \
    --namespace kube-system \
    --set autoDiscovery.clusterName="$CLUSTER" \
    --set awsRegion="$REGION" \
    --set rbac.serviceAccount.create=true \
    --set rbac.serviceAccount.name=cluster-autoscaler \
    --set rbac.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="$AUTOSCALER_ROLE_ARN" \
    --wait \
    --timeout=3m

  step "Verifying Cluster Autoscaler rollout"

  CA_DEPLOYMENT=$(kubectl get deployment \
    -n kube-system \
    -l "app.kubernetes.io/instance=cluster-autoscaler" \
    -o jsonpath="{.items[0].metadata.name}")

  if [[ -z "$CA_DEPLOYMENT" ]]; then
    fail "Could not find Cluster Autoscaler deployment in kube-system"
  fi

  echo "    Deployment name: $CA_DEPLOYMENT"

  kubectl rollout status deployment/"$CA_DEPLOYMENT" \
    -n kube-system \
    --timeout=180s

  ok "Cluster Autoscaler is Ready"
fi

# -----------------------------------------------------------------------------
# Step 4 - Final health check
# -----------------------------------------------------------------------------
step "Final cluster status"

echo -e "\nNodes:"
kubectl get nodes -o wide

echo -e "\nSystem pods:"
kubectl get pods -n kube-system

echo -e "\nALB target group health:"

set +e
aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" \
  --region "$REGION" \
  --query "TargetHealthDescriptions[*].{Target:Target.Id,Port:Target.Port,State:TargetHealth.State}" \
  --output table
TG_EXIT=$?
set -e

if [[ $TG_EXIT -ne 0 ]]; then
  warn "No targets registered yet - expected before first app deploy"
fi

# -----------------------------------------------------------------------------
# Done - print values needed for CircleCI
# -----------------------------------------------------------------------------
ECR_REGISTRY=$(echo "$ECR_URL" | cut -d'/' -f1)
ECR_REPO=$(echo "$ECR_URL" | cut -d'/' -f2)

echo ""
echo "============================================================"
echo " Phase 2 complete. Set these in CircleCI qa-context:"
echo "============================================================"

printf "  %-32s %s\n" "QA_AWS_REGION" "$REGION"
printf "  %-32s %s\n" "QA_EKS_CLUSTER_NAME" "$CLUSTER"
printf "  %-32s %s\n" "QA_ECR_REGISTRY" "$ECR_REGISTRY"
printf "  %-32s %s\n" "QA_ECR_REPO" "$ECR_REPO"
printf "  %-32s %s\n" "QA_TARGET_GROUP_ARN" "$TG_ARN"

echo ""
printf "  %-32s %s\n" "ALB DNS (for testing):" "$ALB_DNS"

echo "============================================================"
echo ""
