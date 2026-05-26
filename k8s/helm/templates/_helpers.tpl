{{/*
Common labels applied to every resource.
*/}}
{{- define "tracking-app.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{ include "tracking-app.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Values.env }}
env: {{ .Values.env }}
{{- end }}
{{- end }}

{{/*
Selector labels used by Deployment.spec.selector and Service.spec.selector.
Mirrors the kustomize base label (app: tracking-app) so existing ALB rules keep working.
*/}}
{{- define "tracking-app.selectorLabels" -}}
app: tracking-app
app.kubernetes.io/name: tracking-app
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
