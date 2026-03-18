# Jenkins Build Examples - Copy & Paste Commands

## 🎯 Quick Reference: How to Run Individual Service Builds

Your Jenkinsfile is **fully ready** with build parameters! Here are actual real-world examples:

---

## 📋 VIA JENKINS WEB UI (Easiest)

### ✅ Example 1: Build All Services for Production

```
1. Go to: http://jenkins:8080/job/FintechOps/
2. Click: "Build with Parameters" button
3. Fill in:
   SERVICES: (leave as default)
   ENVIRONMENT: prod
   SKIP_SONAR: [ ] (unchecked)
   SKIP_TRIVY: [ ] (unchecked)
4. Click: "Build"
5. Monitor: Builds → Build #XXX → Console Output
```

**What happens:**
- Builds all 11 services in parallel (~15-20 minutes)
- Runs SonarQube code quality checks
- Runs Trivy security scans
- Pushes all to ECR with tags like:
  - `fintechops:api-gateway-123-abc`
  - `fintechops:frontend-123-abc`
  - etc.

---

### ✅ Example 2: Build ONLY API Gateway for Development

```
1. Go to: http://jenkins:8080/job/FintechOps/
2. Click: "Build with Parameters"
3. Fill in:
   SERVICES: api-gateway
   ENVIRONMENT: dev
   SKIP_SONAR: [✓] (checked)
   SKIP_TRIVY: [✓] (checked)
4. Click: "Build"
```

**What happens:**
- Builds ONLY api-gateway service (~2-3 minutes)
- Skips code quality and security checks (fast!)
- Pushes to ECR as: `fintechops:api-gateway-dev-XXX`
- Perfect for rapid development

---

### ✅ Example 3: Build Frontend + User Service for Staging

```
1. Go to: http://jenkins:8080/job/FintechOps/
2. Click: "Build with Parameters"
3. Fill in:
   SERVICES: frontend,user-service
   ENVIRONMENT: staging
   SKIP_SONAR: [ ] (unchecked)
   SKIP_TRIVY: [ ] (unchecked)
4. Click: "Build"
```

**What happens:**
- Builds 2 services in parallel (~8-10 minutes)
- Full quality and security checks
- Deploys to staging environment

---

### ✅ Example 4: Build Only Authentication Service (Full Checks)

```
1. Go to: http://jenkins:8080/job/FintechOps/
2. Click: "Build with Parameters"
3. Fill in:
   SERVICES: auth-service
   ENVIRONMENT: prod
   SKIP_SONAR: [ ] (unchecked)
   SKIP_TRIVY: [ ] (unchecked)
4. Click: "Build"
```

**What happens:**
- Builds ONLY auth-service with full checks (~5 minutes)
- Completes full SonarQube analysis
- Runs Trivy security scan
- Pushes to ECR as: `fintechops:auth-service-123-abc`

---

## 🖥️ VIA CURL (Remote / Automated)

### Example 1: Build Single Service - API Gateway

```bash
#!/bin/bash

JENKINS_URL="http://jenkins:8080"
JENKINS_USER="admin"
JENKINS_TOKEN="your-api-token"

curl -X POST "${JENKINS_URL}/job/FintechOps/buildWithParameters" \
  -u ${JENKINS_USER}:${JENKINS_TOKEN} \
  -F "SERVICES=api-gateway" \
  -F "ENVIRONMENT=prod" \
  -F "SKIP_SONAR=false" \
  -F "SKIP_TRIVY=false"

echo "✅ Build triggered for api-gateway"
echo "📊 Monitor at: ${JENKINS_URL}/job/FintechOps/"
```

**Usage:**
```bash
chmod +x trigger-build.sh
./trigger-build.sh
```

---

### Example 2: Build Multiple Services - Frontend & Auth

```bash
#!/bin/bash

JENKINS_URL="http://jenkins:8080"
JENKINS_USER="admin"
JENKINS_TOKEN="your-api-token"
SERVICES="frontend,auth-service"
ENVIRONMENT="staging"

curl -X POST "${JENKINS_URL}/job/FintechOps/buildWithParameters" \
  -u ${JENKINS_USER}:${JENKINS_TOKEN} \
  -F "SERVICES=${SERVICES}" \
  -F "ENVIRONMENT=${ENVIRONMENT}" \
  -F "SKIP_SONAR=false" \
  -F "SKIP_TRIVY=false"

echo "✅ Build triggered for: ${SERVICES}"
```

---

### Example 3: Fast Development Build (Skip Checks)

```bash
#!/bin/bash

JENKINS_URL="http://jenkins:8080"
JENKINS_USER="admin"
JENKINS_TOKEN="your-api-token"

curl -X POST "${JENKINS_URL}/job/FintechOps/buildWithParameters" \
  -u ${JENKINS_USER}:${JENKINS_TOKEN} \
  -F "SERVICES=api-gateway" \
  -F "ENVIRONMENT=dev" \
  -F "SKIP_SONAR=true" \
  -F "SKIP_TRIVY=true"

echo "✅ Fast build triggered (skipping checks)"
```

---

## 🔐 How to Get Jenkins API Token

```bash
# 1. Go to Jenkins UI
# 2. Click your user avatar (top right)
# 3. Click "Configure"
# 4. Scroll to "API Token" section
# 5. Click "Add new Token"
# 6. Copy the token
# 7. Use in scripts: -u admin:your-token-here
```

---

## 📊 VIA JENKINS CLI

### Installation

```bash
# Download Jenkins CLI
cd ~/jenkins-cli
wget http://jenkins:8080/jnlpJars/jenkins-cli.jar

# Or via brew (macOS)
brew install jenkins-cli
```

### Example 1: Build Single Service

```bash
java -jar jenkins-cli.jar \
  -s http://jenkins:8080 \
  build FintechOps \
  -p SERVICES=api-gateway \
  -p ENVIRONMENT=prod \
  -p SKIP_SONAR=false \
  -p SKIP_TRIVY=false \
  -w

# -w flag waits for completion and shows result
```

### Example 2: Build Multiple Services

```bash
java -jar jenkins-cli.jar \
  -s http://jenkins:8080 \
  build FintechOps \
  -p SERVICES=frontend,auth-service,user-service \
  -p ENVIRONMENT=staging \
  -p SKIP_SONAR=false \
  -p SKIP_TRIVY=false \
  -w
```

### Example 3: Quick Dev Build

```bash
java -jar jenkins-cli.jar \
  -s http://jenkins:8080 \
  build FintechOps \
  -p SERVICES=api-gateway \
  -p ENVIRONMENT=dev \
  -p SKIP_SONAR=true \
  -p SKIP_TRIVY=true \
  -w
```

---

## 🌐 VIA GITHUB ACTIONS (Automated)

Create `.github/workflows/jenkins-trigger.yml`:

```yaml
name: Trigger Jenkins Build

on:
  workflow_dispatch:
    inputs:
      services:
        description: 'Services to build (comma-separated)'
        required: true
        default: 'api-gateway,frontend'
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - prod
      skip_sonar:
        description: 'Skip SonarQube analysis'
        required: false
        default: false
        type: boolean
      skip_trivy:
        description: 'Skip Trivy security scan'
        required: false
        default: false
        type: boolean

jobs:
  trigger-jenkins:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Jenkins Build
        run: |
          curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
            -u admin:${{ secrets.JENKINS_API_TOKEN }} \
            -F 'SERVICES=${{ github.event.inputs.services }}' \
            -F 'ENVIRONMENT=${{ github.event.inputs.environment }}' \
            -F 'SKIP_SONAR=${{ github.event.inputs.skip_sonar }}' \
            -F 'SKIP_TRIVY=${{ github.event.inputs.skip_trivy }}'
      
      - name: Print Jenkins URL
        run: |
          echo "✅ Build triggered!"
          echo "📊 Monitor at: http://jenkins:8080/job/FintechOps/"
```

**Usage:**
```
GitHub → Actions → Trigger Jenkins Build → Run workflow

Select:
- Services: api-gateway,auth-service
- Environment: staging
- Skip SonarQube: false
- Skip Trivy: false

Click: Run workflow
```

---

## 📈 All Available Services (Copy-Paste Ready)

```bash
# Individual services (use one at a time):
SERVICES=frontend
SERVICES=api-gateway
SERVICES=auth-service
SERVICES=user-service
SERVICES=market-service
SERVICES=news-service
SERVICES=blog-service
SERVICES=calculator-service
SERVICES=chatbot-service
SERVICES=email-service
SERVICES=admin-service

# Multiple services (use comma-separated):
SERVICES=frontend,api-gateway
SERVICES=api-gateway,auth-service,user-service
SERVICES=frontend,api-gateway,auth-service

# All services (default):
SERVICES=frontend,api-gateway,auth-service,user-service,market-service,news-service,blog-service,calculator-service,chatbot-service,email-service,admin-service
```

---

## 🎯 Build Scenarios by Team

### **Developer Building Own Service**

```bash
# Fast iteration during development
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
  -u admin:token \
  -F 'SERVICES=api-gateway' \
  -F 'ENVIRONMENT=dev' \
  -F 'SKIP_SONAR=true' \
  -F 'SKIP_TRIVY=true'

# Time: ~2 minutes
# Next step: Test in Kubernetes
```

### **Code Review / Quality Check**

```bash
# Full checks for pull request
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
  -u admin:token \
  -F 'SERVICES=api-gateway' \
  -F 'ENVIRONMENT=staging' \
  -F 'SKIP_SONAR=false' \
  -F 'SKIP_TRIVY=false'

# Time: ~5 minutes
# Check: Code quality + security
```

### **Staging Deployment (Multiple Services)**

```bash
# Test multiple related services together
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
  -u admin:token \
  -F 'SERVICES=api-gateway,auth-service,user-service' \
  -F 'ENVIRONMENT=staging' \
  -F 'SKIP_SONAR=false' \
  -F 'SKIP_TRIVY=false'

# Time: ~8 minutes
# Deploy to staging for QA testing
```

### **Production Release (All Services)**

```bash
# Full production build with all checks
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
  -u admin:token \
  -F 'SERVICES=frontend,api-gateway,auth-service,user-service,market-service,news-service,blog-service,calculator-service,chatbot-service,email-service,admin-service' \
  -F 'ENVIRONMENT=prod' \
  -F 'SKIP_SONAR=false' \
  -F 'SKIP_TRIVY=false'

# Time: ~20 minutes
# All 11 services with full quality/security checks
```

---

## 🔍 Monitor Build Progress

### In Jenkins UI

```
1. Jenkins Dashboard → FintechOps job → Build History
2. Click on the build number (e.g., #123)
3. Click "Console Output"

View real-time:
├─ Checkout: git clone...
├─ SonarQube: scanning code...
├─ Build Docker Images:
│  ├─ api-gateway building... ✓
│  ├─ auth-service building... ✓
│  └─ user-service building... ✓
├─ Trivy Scan:
│  ├─ api-gateway scanning... ✓
│  ├─ auth-service scanning... ✓
│  └─ user-service scanning... ✓
├─ Push to ECR:
│  ├─ api-gateway pushing... ✓
│  ├─ auth-service pushing... ✓
│  └─ user-service pushing... ✓
└─ Deploy: ✓ Complete
```

### Via AWS CLI

```bash
# List images built
aws ecr list-images \
  --repository-name fintechops \
  --region ap-south-1

# Get specific image details
aws ecr describe-images \
  --repository-name fintechops \
  --query "imageDetails[?contains(imageTags[0], 'api-gateway')]"
```

### Via Docker

```bash
# List pulled images
docker images | grep fintechops

# Pull latest service image
docker pull 196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:api-gateway-latest
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Unknown service 'xyz'"

```bash
# Solution: Use valid service name
SERVICES=api-gateway    # ✅ Correct
SERVICES=apigateway     # ❌ Wrong (no hyphen)

# Valid services:
frontend, api-gateway, auth-service, user-service, market-service, 
news-service, blog-service, calculator-service, chatbot-service, 
email-service, admin-service
```

### Issue: Build Stuck at Quality Gate

```bash
# Solution: Check SonarQube dashboard
# http://sonarqube:9000/dashboard?id=fintechops

# View quality gate violations:
# - High code smells detected
# - Low test coverage
# - Vulnerabilities found

# Fix and push again - build will retry
```

### Issue: Build Stuck at Trivy Scan

```bash
# Solution: Check for CRITICAL/HIGH CVEs

# View trivy report:
# Jenkins → Build → Artifacts → trivy-api-gateway.txt

# Either:
# 1. Update base Docker image to patched version
# 2. Add CVE to .trivyignore with justification
# 3. Both service and re-push

# Build will retry automatically
```

---

## 📊 Expected Build Times

```
Single Service (dev, no checks):     ~2 min
Single Service (prod, full checks):  ~5-7 min
3 Services (staging, full checks):   ~8-10 min
All 11 Services (prod, full checks): ~18-22 min

Why parallel is faster:
- All services build simultaneously
- 11 services in parallel ≠ 11x the time
- Trivy scans happen in parallel
- ECR pushes happen in parallel
```

---

## ✅ Verification After Build

```bash
# 1. Check Jenkins build succeeded
Jenkins → FintechOps → Build #XXX → Status: ✅ SUCCESS

# 2. Verify images in ECR
aws ecr list-images --repository-name fintechops --region ap-south-1

# 3. Check Kubernetes deployment
kubectl get deployments -n production

# 4. View pod logs
kubectl logs -f deployment/api-gateway -n production

# 5. Test endpoint
curl http://api-gateway.your-domain.com/health
```

---

## 🎓 Understanding Build Parameters

Your Jenkinsfile accepts these parameters:

| Parameter | Type | Default | Allowed Values |
|-----------|------|---------|-----------------|
| `SERVICES` | String | All 11 | See list above |
| `ENVIRONMENT` | Choice | dev | dev, staging, prod |
| `SKIP_SONAR` | Boolean | false | true, false |
| `SKIP_TRIVY` | Boolean | false | true, false |

**Why these parameters?**

- **SERVICES**: Build only what changed (faster, cheaper)
- **ENVIRONMENT**: Different configs for dev/staging/prod
- **SKIP_SONAR**: Developers want fast iteration
- **SKIP_TRIVY**: Security team might want to run separately

---

## 🚀 You're Ready!

Your CI/CD pipeline is **fully functional** with:

✅ Build each service individually  
✅ Build multiple services together  
✅ Build all services at once  
✅ Different environments (dev/staging/prod)  
✅ Flexible quality checks  
✅ All images in same ECR (organized by tags)  
✅ Parallel builds for speed  

**Just push to Jenkins and start building! 🎉**
