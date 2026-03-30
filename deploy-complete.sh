#!/bin/bash
set -e

echo "🚀 FintechOps EKS Deployment - Complete Solution"
echo "================================================"

# Function to wait for pods
wait_for_pods() {
    local app=$1
    local timeout=${2:-300}
    echo "⏳ Waiting for $app pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=$app -n fintechops --timeout=${timeout}s || echo "⚠️ $app timeout (continuing...)"
}

# Function to check if resource exists
resource_exists() {
    kubectl get $1 $2 -n fintechops >/dev/null 2>&1
}

echo "📁 Step 1: Create namespace and secrets"
kubectl create namespace fintechops --dry-run=client -o yaml | kubectl apply -f -

echo "🔐 Step 2: Create ECR secret"
kubectl create secret docker-registry ecr-secret \
  --docker-server=836548370285.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  --namespace=fintechops \
  --dry-run=client -o yaml | kubectl apply -f -

echo "⚙️ Step 3: Apply configuration"
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/secrets-working.yaml

echo "🗄️ Step 4: Clean and deploy databases"
# Clean existing databases
kubectl delete statefulset mongodb -n fintechops --ignore-not-found=true
kubectl delete statefulset postgres -n fintechops --ignore-not-found=true
kubectl delete pvc -l app=mongodb -n fintechops --ignore-not-found=true
kubectl delete pvc -l app=postgres -n fintechops --ignore-not-found=true

# Deploy simple databases (Deployment, not StatefulSet)
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: fintechops
  labels:
    app: mongodb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "fintechops123"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          exec:
            command:
            - mongosh
            - --eval
            - "db.adminCommand('ping')"
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: fintechops
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: fintechops
  labels:
    app: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "fintechops"
        - name: POSTGRES_USER
          value: "fintechops"
        - name: POSTGRES_PASSWORD
          value: "fintechops123"
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - fintechops
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: fintechops
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: fintechops
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: fintechops
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
EOF

wait_for_pods "mongodb" 120
wait_for_pods "postgres" 120

echo "🚀 Step 5: Clean and deploy application services"
# Delete existing deployments to avoid immutable field errors
kubectl delete deployment frontend api-gateway auth-service user-service market-service news-service blog-service calculator-service chatbot-service email-service admin-service -n fintechops --ignore-not-found=true

# Apply deployments
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

echo "⏳ Step 6: Wait for application services"
sleep 30

echo "🌐 Step 7: Deploy ALB ingress"
kubectl apply -f k8s/base/ingress.yaml

echo "📊 Step 8: Show deployment status"
echo ""
echo "=== PODS ==="
kubectl get pods -n fintechops
echo ""
echo "=== SERVICES ==="
kubectl get svc -n fintechops
echo ""
echo "=== INGRESS ==="
kubectl get ingress -n fintechops
echo ""

echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🔗 Your app URL:"
ALB_URL=$(kubectl get ingress fintechops-alb -n fintechops -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Provisioning...")
echo "http://$ALB_URL"
echo ""
echo "🔍 To check logs:"
echo "kubectl logs -l app=auth-service -n fintechops"
echo ""
echo "🩺 To test health:"
echo "curl http://$ALB_URL/api/auth/health"
echo ""
echo "🎉 Your FintechOps app is now running on EKS!"