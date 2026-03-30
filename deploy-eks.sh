#!/bin/bash
set -e

echo "🚀 Deploying FintechOps to EKS..."

# Create namespace
echo "📁 Creating namespace..."
kubectl create namespace fintechops --dry-run=client -o yaml | kubectl apply -f -

# Create ECR secret
echo "🔐 Creating ECR secret..."
kubectl create secret docker-registry ecr-secret \
  --docker-server=836548370285.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  --namespace=fintechops \
  --dry-run=client -o yaml | kubectl apply -f -

# Apply configuration
echo "⚙️ Applying configuration..."
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/secrets-working.yaml

# Deploy databases first
echo "🗄️ Deploying databases..."
kubectl apply -f k8s/base/deployments/mongodb.yaml
kubectl apply -f k8s/base/deployments/postgres.yaml
kubectl apply -f k8s/base/deployments/redis.yaml

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n fintechops --timeout=300s || echo "MongoDB timeout (continuing...)"
kubectl wait --for=condition=ready pod -l app=postgres -n fintechops --timeout=300s || echo "PostgreSQL timeout (continuing...)"
kubectl wait --for=condition=ready pod -l app=redis -n fintechops --timeout=300s || echo "Redis timeout (continuing...)"

# Deploy application services
echo "🚀 Deploying application services..."
kubectl apply -f k8s/base/deployments/frontend.yaml
kubectl apply -f k8s/base/deployments/api-gateway.yaml
kubectl apply -f k8s/base/deployments/auth-service.yaml
kubectl apply -f k8s/base/deployments/user-service.yaml
kubectl apply -f k8s/base/deployments/market-service.yaml
kubectl apply -f k8s/base/deployments/news-service.yaml
kubectl apply -f k8s/base/deployments/blog-service.yaml
kubectl apply -f k8s/base/deployments/calculator-service.yaml
kubectl apply -f k8s/base/deployments/chatbot-service.yaml
kubectl apply -f k8s/base/deployments/email-service.yaml
kubectl apply -f k8s/base/deployments/admin-service.yaml

# Wait for application services
echo "⏳ Waiting for application services..."
sleep 30

# Deploy ingress (ALB)
echo "🌐 Deploying ALB ingress..."
kubectl apply -f k8s/base/ingress.yaml

# Show status
echo "📊 Deployment status:"
kubectl get pods -n fintechops
echo ""
kubectl get svc -n fintechops
echo ""
kubectl get ingress -n fintechops

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Getting ALB URL (may take 2-3 minutes to provision):"
echo "kubectl get ingress fintechops-alb -n fintechops -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
echo ""
echo "🔍 To check pod logs:"
echo "kubectl logs -l app=auth-service -n fintechops"
echo ""
echo "🩺 To test health endpoint:"
echo "kubectl port-forward svc/auth-service 3001:3001 -n fintechops"
echo "curl http://localhost:3001/health"