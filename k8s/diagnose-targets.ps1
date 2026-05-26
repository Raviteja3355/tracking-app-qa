# Diagnoses why ALB targets are unhealthy.
# Run from anywhere: powershell -File diagnose-targets.ps1

$ErrorActionPreference = "Continue"

$TG_ARN  = "arn:aws:elasticloadbalancing:us-west-2:232317180286:targetgroup/uniuni-qa-tracking-tg/6a7dd98f532542c2"
$NODE_SG = "sg-0b6a5a2344a2616d2"
$REGION  = "us-west-2"

Write-Host "`n=== 1. TARGET HEALTH (with reason) ===" -ForegroundColor Cyan
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region $REGION `
  --query "TargetHealthDescriptions[].{IP:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason,Desc:TargetHealth.Description}" `
  --output table

Write-Host "`n=== 2. NODE ENI(s) AND THEIR SGs ===" -ForegroundColor Cyan
$NODE_NAMES = (kubectl get pods -n tracking-app-qa -l app=tracking-app -o jsonpath='{.items[*].spec.nodeName}') -split ' ' | Sort-Object -Unique
foreach ($NODE in $NODE_NAMES) {
  if ([string]::IsNullOrWhiteSpace($NODE)) { continue }
  $INSTANCE_ID = (aws ec2 describe-instances --filters "Name=private-dns-name,Values=$NODE" --region $REGION --query "Reservations[].Instances[].InstanceId" --output text)
  Write-Host "--- Node: $NODE  Instance: $INSTANCE_ID ---" -ForegroundColor Yellow
  aws ec2 describe-instances --instance-ids $INSTANCE_ID --region $REGION `
    --query "Reservations[].Instances[].NetworkInterfaces[].{ENI:NetworkInterfaceId,Subnet:SubnetId,SGs:Groups[].GroupName}" `
    --output json
}

Write-Host "`n=== 3. ALB SECURITY GROUPS ===" -ForegroundColor Cyan
aws elbv2 describe-load-balancers --names uniuni-qa-tracking-alb --region $REGION `
  --query "LoadBalancers[0].SecurityGroups" --output table

Write-Host "`n=== 4. INGRESS RULES on node SG ($NODE_SG) ===" -ForegroundColor Cyan
aws ec2 describe-security-groups --group-ids $NODE_SG --region $REGION `
  --query "SecurityGroups[0].IpPermissions[].{Port:FromPort,Proto:IpProtocol,SrcSGs:UserIdGroupPairs[].GroupId,SrcCIDRs:IpRanges[].CidrIp}" `
  --output json

Write-Host "`n=== 5. ALB LISTENER (port + target group) ===" -ForegroundColor Cyan
$ALB_ARN = (aws elbv2 describe-load-balancers --names uniuni-qa-tracking-alb --region $REGION --query "LoadBalancers[0].LoadBalancerArn" --output text)
aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --region $REGION `
  --query "Listeners[].{Port:Port,Protocol:Protocol,Action:DefaultActions[0].Type,TG:DefaultActions[0].TargetGroupArn}" `
  --output table

Write-Host "`n=== 6. TARGET GROUP HEALTH-CHECK CONFIG ===" -ForegroundColor Cyan
aws elbv2 describe-target-groups --target-group-arns $TG_ARN --region $REGION `
  --query "TargetGroups[0].{Port:Port,Proto:Protocol,HCProto:HealthCheckProtocol,HCPort:HealthCheckPort,HCPath:HealthCheckPath,HCInterval:HealthCheckIntervalSeconds,HC2xx:Matcher.HttpCode}" `
  --output table

Write-Host "`nDone." -ForegroundColor Green
