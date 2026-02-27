#!/bin/bash
# ============================================
# Create EKS Cluster for FintechOps
# ============================================
# Prerequisites: AWS CLI configured, eksctl installed
# Usage: ./setup-eks.sh <CLUSTER_NAME> <AWS_REGION>

set -euo pipefail

CLUSTER_NAME="${1:-fintechops-cluster}"
AWS_REGION="${2:-us-east-1}"

echo "=========================================="
echo "Creating EKS Cluster: ${CLUSTER_NAME}"
echo "Region: ${AWS_REGION}"
echo "=========================================="

# Create cluster with eksctl
eksctl create cluster \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --version 1.29 \
  --nodegroup-name fintechops-nodes \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 6 \
  --managed \
  --asg-access \
  --with-oidc \
  --ssh-access \
  --ssh-public-key ~/.ssh/id_rsa.pub \
  --tags "Project=fintechops,Environment=production"

echo ""
echo "✓ EKS Cluster created!"
echo ""

# Install EBS CSI Driver (required for PersistentVolumes with gp3)
echo "Installing EBS CSI Driver..."
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --role-name AmazonEKS_EBS_CSI_DriverRole \
  --role-only \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve

eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --service-account-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AmazonEKS_EBS_CSI_DriverRole" \
  --force

echo ""
echo "✓ EBS CSI Driver installed!"
echo ""

# Update kubeconfig
aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region "${AWS_REGION}"

echo "=========================================="
echo "Cluster is ready! Next steps:"
echo "  1. ./install-alb-controller.sh ${CLUSTER_NAME} ${AWS_REGION} \$(aws sts get-caller-identity --query Account --output text)"
echo "  2. ./install-argocd.sh <YOUR_DOMAIN>"
echo "  3. ./install-monitoring.sh <YOUR_DOMAIN> <ACM_CERT_ARN>"
echo "  4. kubectl apply -f k8s/argocd-apps.yaml"
echo "=========================================="
