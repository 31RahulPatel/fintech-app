#!/bin/bash
# ============================================
# Install Prometheus + Grafana on EKS
# Using kube-prometheus-stack Helm chart
# ============================================
# Usage: ./install-monitoring.sh <DOMAIN> <ACM_CERT_ARN>

set -euo pipefail

DOMAIN="${1:-fintechops.com}"
ACM_CERT_ARN="${2:-REPLACE_WITH_ACM_CERT_ARN}"

echo "=========================================="
echo "Installing Monitoring Stack"
echo "=========================================="

# Step 1: Create namespace
echo "[1/4] Creating monitoring namespace..."
kubectl create namespace monitoring 2>/dev/null || echo "→ Namespace already exists"

# Step 2: Add Helm repo
echo "[2/4] Adding Helm repos..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Step 3: Install kube-prometheus-stack
echo "[3/4] Installing kube-prometheus-stack..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes[0]=ReadWriteOnce \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=gp3 \
  --set grafana.adminPassword=FintechOps2024! \
  --set grafana.persistence.enabled=true \
  --set grafana.persistence.size=10Gi \
  --set grafana.persistence.storageClassName=gp3 \
  --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.accessModes[0]=ReadWriteOnce \
  --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi \
  --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.storageClassName=gp3 \
  --wait --timeout 600s

# Step 4: Apply shared ALB Ingress for Grafana & Prometheus
echo "[4/4] Creating ALB Ingress for monitoring..."

cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/group.name: fintechops-shared
    alb.ingress.kubernetes.io/group.order: "400"
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: ${ACM_CERT_ARN}
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
    alb.ingress.kubernetes.io/backend-protocol: HTTP
spec:
  rules:
    - host: grafana.${DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus-grafana
                port:
                  number: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prometheus-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/group.name: fintechops-shared
    alb.ingress.kubernetes.io/group.order: "500"
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: ${ACM_CERT_ARN}
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/healthcheck-path: /-/healthy
    alb.ingress.kubernetes.io/backend-protocol: HTTP
spec:
  rules:
    - host: prometheus.${DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus-kube-prometheus-prometheus
                port:
                  number: 9090
EOF

echo ""
echo "✓ Monitoring stack installed!"
echo ""
echo "=========================================="
echo "Grafana UI:     https://grafana.${DOMAIN}"
echo "  Username:     admin"
echo "  Password:     FintechOps2024!"
echo ""
echo "Prometheus UI:  https://prometheus.${DOMAIN}"
echo "=========================================="
echo ""
echo "IMPORTANT: Update the ACM certificate ARN if you used the default!"
