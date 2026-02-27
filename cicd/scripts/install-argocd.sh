#!/bin/bash
# ============================================
# Install ArgoCD on EKS
# ============================================
# Usage: ./install-argocd.sh <DOMAIN>
# Example: ./install-argocd.sh fintechops.com

set -euo pipefail

DOMAIN="${1:-fintechops.com}"

echo "=========================================="
echo "Installing ArgoCD"
echo "=========================================="

# Step 1: Create namespace
echo "[1/4] Creating argocd namespace..."
kubectl create namespace argocd 2>/dev/null || echo "→ Namespace already exists"

# Step 2: Install ArgoCD
echo "[2/4] Installing ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Step 3: Wait for rollout
echo "[3/4] Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available deployment/argocd-server \
  -n argocd --timeout=300s

# Step 4: Patch ArgoCD server for insecure mode (ALB handles TLS)
echo "[4/4] Patching ArgoCD server for ALB..."
kubectl patch deployment argocd-server -n argocd \
  --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--insecure"}]' \
  2>/dev/null || echo "→ Already patched"

# Apply the shared ALB ingress for ArgoCD
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/group.name: fintechops-shared
    alb.ingress.kubernetes.io/group.order: "300"
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: REPLACE_WITH_ACM_CERT_ARN
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
    alb.ingress.kubernetes.io/backend-protocol: HTTP
spec:
  rules:
    - host: argocd.${DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 80
EOF

echo ""
echo "✓ ArgoCD installed!"
echo ""

# Get initial admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "=========================================="
echo "ArgoCD UI: https://argocd.${DOMAIN}"
echo "Username: admin"
echo "Password: ${ARGOCD_PASSWORD}"
echo "=========================================="
echo ""
echo "IMPORTANT: Update the ACM certificate ARN in the ingress!"
echo "  kubectl edit ingress argocd-ingress -n argocd"
echo ""
echo "Next: Apply the ArgoCD application manifests:"
echo "  kubectl apply -f k8s/argocd-apps.yaml"
