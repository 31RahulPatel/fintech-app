# FintechOps K8s Deployment Checklist

## ✅ Completed
- [x] All Docker images built and pushed to ECR
- [x] GitHub repo URL configured in ArgoCD apps
- [x] AWS Account ID configured in overlays
- [x] All 11 services have images in ECR

## ⚠️ Required Before Deployment

### 1. Domain & SSL Certificate
```bash
# Get your ACM Certificate ARN
aws acm list-certificates --region us-east-1

# Update k8s/base/ingress.yaml with:
# - Your ACM Certificate ARN
# - Your domain name (e.g., fintechops.com)
```

**Files to update:**
- `k8s/base/ingress.yaml` - Lines 23, 58 (ACM ARN)
- `k8s/base/ingress.yaml` - Lines 33, 62 (Domain)
- `k8s/base/configmap.yaml` - Line 26 (API URL)

### 2. Secrets Configuration
```bash
# Update k8s/base/secrets.yaml with real values:
```

**Required secrets:**
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - Generate: `openssl rand -base64 32`
- `MONGODB_ROOT_PASSWORD` - Strong password
- `POSTGRES_PASSWORD` - Strong password
- `AWS_ACCESS_KEY_ID` - From jenkins_accessKeys.csv
- `AWS_SECRET_ACCESS_KEY` - From jenkins_accessKeys.csv
- `AWS_COGNITO_USER_POOL_ID` - From AWS Cognito
- `AWS_COGNITO_CLIENT_ID` - From AWS Cognito
- `AWS_COGNITO_CLIENT_SECRET` - From AWS Cognito
- `GROQ_API_KEY` - From Groq AI
- `MARKET_API_KEY` - From your market data provider
- `NEWS_API_KEY` - From NewsAPI.org
- `AWS_SES_FROM_EMAIL` - Verified email in SES

### 3. Push to GitHub
```bash
cd /Users/rahulpatel/Downloads/fintech
git add k8s/
git commit -m "Configure K8s manifests for deployment"
git push origin main
```

### 4. Deploy ArgoCD Applications
```bash
# Apply ArgoCD apps
kubectl apply -f k8s/argocd-apps.yaml

# Verify ArgoCD apps
kubectl get applications -n argocd

# Check sync status
argocd app list
```

### 5. Monitor Deployment
```bash
# Watch pods
kubectl get pods -n fintechops-production -w

# Check logs
kubectl logs -f deployment/api-gateway -n fintechops-production

# Check ingress
kubectl get ingress -n fintechops-production
```

## 📊 Current ECR Images (Build #14)
- ✅ frontend-latest (27.52 MB)
- ✅ api-gateway-latest (69.12 MB)
- ✅ auth-service-latest (112.67 MB)
- ✅ user-service-latest (96.56 MB)
- ✅ calculator-service-latest (68.41 MB)
- ✅ market-service-latest (93.11 MB)
- ✅ news-service-latest (75.07 MB)
- ✅ blog-service-latest (73.43 MB)
- ✅ chatbot-service-latest (80.62 MB)
- ✅ email-service-latest (102.65 MB)
- ✅ admin-service-latest (80.38 MB)

## 🔗 Resources
- GitHub: https://github.com/31RahulPatel/fintech-app.git
- ECR: 836548370285.dkr.ecr.us-east-1.amazonaws.com/fintechops
- Region: us-east-1

## 🚀 Quick Deploy (After completing checklist)
```bash
# 1. Update secrets and domain
# 2. Push to GitHub
git push origin main

# 3. Deploy to production
kubectl apply -f k8s/argocd-apps.yaml

# 4. Sync ArgoCD
argocd app sync fintechops-production

# 5. Get ALB URL
kubectl get ingress -n fintechops-production
```
