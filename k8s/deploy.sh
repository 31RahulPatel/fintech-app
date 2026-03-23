#!/bin/bash

# ============================================
# FintechOps Deployment Script
# ============================================
# This script deploys the application to EKS using ArgoCD
# ============================================

set -e

echo "🚀 FintechOps Deployment Script"
echo "================================"

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured or cluster is not accessible"
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Step 1: Create namespace if not exists
echo ""
echo "📦 Creating namespace..."
kubectl create namespace fintechops --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace fintechops-production --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace fintechops-staging --dry-run=client -o yaml | kubectl apply -f -

# Step 2: Apply production secrets
echo ""
echo "🔐 Applying production secrets..."
if [ -f "k8s/base/secrets-production.yaml" ]; then
    # Apply to base namespace
    kubectl apply -f k8s/base/secrets-production.yaml
    
    # Copy secret to production namespace
    kubectl get secret fintechops-secrets -n fintechops -o yaml | \
        sed 's/namespace: fintechops/namespace: fintechops-production/' | \
        kubectl apply -f -
    
    # Copy secret to staging namespace
    kubectl get secret fintechops-secrets -n fintechops -o yaml | \
        sed 's/namespace: fintechops/namespace: fintechops-staging/' | \
        kubectl apply -f -
    
    echo "✅ Secrets applied successfully"
else
    echo "⚠️  secrets-production.yaml not found. Using template..."
    kubectl apply -f k8s/base/secrets.yaml
    
    kubectl get secret fintechops-secrets -n fintechops -o yaml | \
        sed 's/namespace: fintechops/namespace: fintechops-production/' | \
        kubectl apply -f -
    
    kubectl get secret fintechops-secrets -n fintechops -o yaml | \
        sed 's/namespace: fintechops/namespace: fintechops-staging/' | \
        kubectl apply -f -
fi

# Step 3: Apply ArgoCD applications
echo ""
echo "🔄 Deploying ArgoCD applications..."
kubectl apply -f k8s/argocd-apps.yaml

# Step 4: Wait for ArgoCD to sync
echo ""
echo "⏳ Waiting for ArgoCD to sync applications..."
sleep 5

# Step 5: Check ArgoCD application status
echo ""
echo "📊 ArgoCD Application Status:"
kubectl get applications -n argocd

# Step 6: Check pods in production namespace
echo ""
echo "📊 Pods in production namespace:"
kubectl get pods -n fintechops-production

echo ""
echo "✅ Deployment initiated successfully!"
echo ""
echo "Next steps:"
echo "1. Monitor ArgoCD UI for sync status"
echo "2. Check pod status: kubectl get pods -n fintechops-production -w"
echo "3. Check ingress: kubectl get ingress -n fintechops-production"
echo "4. View logs: kubectl logs -f deployment/api-gateway -n fintechops-production"
