#!/bin/bash
# ============================================
# Install AWS Load Balancer Controller on EKS
# ============================================
# Prerequisites: eksctl, kubectl, helm configured
# Usage: ./install-alb-controller.sh <CLUSTER_NAME> <AWS_REGION> <AWS_ACCOUNT_ID>

set -euo pipefail

CLUSTER_NAME="${1:?Usage: $0 <CLUSTER_NAME> <AWS_REGION> <AWS_ACCOUNT_ID>}"
AWS_REGION="${2:-us-east-1}"
AWS_ACCOUNT_ID="${3:?AWS_ACCOUNT_ID required}"

echo "=========================================="
echo "Installing AWS Load Balancer Controller"
echo "Cluster: ${CLUSTER_NAME}"
echo "Region: ${AWS_REGION}"
echo "=========================================="

# Step 1: Create IAM OIDC provider
echo "[1/5] Creating IAM OIDC provider..."
eksctl utils associate-iam-oidc-provider \
  --cluster "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --approve

# Step 2: Download IAM policy
echo "[2/5] Creating IAM policy..."
curl -fsSL -o /tmp/iam-policy.json \
  https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.1/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file:///tmp/iam-policy.json \
  2>/dev/null || echo "→ IAM policy already exists"

# Step 3: Create IAM service account
echo "[3/5] Creating IAM service account..."
eksctl create iamserviceaccount \
  --cluster="${CLUSTER_NAME}" \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy" \
  --region "${AWS_REGION}" \
  --approve \
  --override-existing-serviceaccounts

# Step 4: Install via Helm
echo "[4/5] Installing via Helm..."
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName="${CLUSTER_NAME}" \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region="${AWS_REGION}" \
  --set vpcId="$(aws eks describe-cluster --name "${CLUSTER_NAME}" --region "${AWS_REGION}" --query "cluster.resourcesVpcConfig.vpcId" --output text)"

# Step 5: Verify
echo "[5/5] Verifying installation..."
kubectl wait --for=condition=available deployment/aws-load-balancer-controller \
  -n kube-system --timeout=120s

echo ""
echo "✓ AWS Load Balancer Controller installed successfully!"
echo ""
kubectl get deployment -n kube-system aws-load-balancer-controller
