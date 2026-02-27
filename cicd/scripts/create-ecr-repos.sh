#!/bin/bash
# ============================================
# Create Single ECR Repository for FintechOps
# ============================================
# All service images stored in ONE repo with service-prefixed tags
# e.g., fintechops:frontend-5-a1b2c3d, fintechops:api-gateway-5-a1b2c3d
#
# Usage: ./create-ecr-repos.sh <AWS_REGION>

set -euo pipefail

AWS_REGION="${1:-us-east-1}"
REPO_NAME="fintechops"

echo "=========================================="
echo "Creating ECR repository in ${AWS_REGION}"
echo "=========================================="

echo -n "Creating ${REPO_NAME}... "
aws ecr create-repository \
  --repository-name "${REPO_NAME}" \
  --region "${AWS_REGION}" \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  2>/dev/null && echo "✓ Created" || echo "→ Already exists"

# Lifecycle policy: keep last 50 images (covers ~5 builds x 11 services)
aws ecr put-lifecycle-policy \
  --repository-name "${REPO_NAME}" \
  --region "${AWS_REGION}" \
  --lifecycle-policy-text '{
    "rules": [
      {
        "rulePriority": 1,
        "description": "Keep last 50 tagged images",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 50
        },
        "action": {
          "type": "expire"
        }
      }
    ]
  }' 2>/dev/null

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

echo ""
echo "=========================================="
echo "ECR Repository: ${ECR_URI}"
echo "=========================================="
echo ""
echo "Image tagging convention:"
echo "  ${ECR_URI}:frontend-<BUILD>-<COMMIT>"
echo "  ${ECR_URI}:api-gateway-<BUILD>-<COMMIT>"
echo "  ${ECR_URI}:auth-service-<BUILD>-<COMMIT>"
echo "  ... (one tag per service per build)"
echo ""
echo "To login to ECR:"
echo "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
