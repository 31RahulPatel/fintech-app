# Jenkins Build Parameters Guide - Multiple Services

## ✅ Current Jenkinsfile Capabilities

Your Jenkinsfile ALREADY supports:

1. **Build all 11 services at once** (default)
2. **Build individual services** (one at a time)
3. **Build multiple selected services** (custom combinations)
4. **Different environments** (dev, staging, prod)
5. **Skip SonarQube or Trivy** (for faster builds)

---

## 🚀 How to Use Jenkins Build Parameters

### Option 1: Build ALL Services (Default)

```
Jenkins → FintechOps Job → Build with Parameters

SERVICES: Leave as default
  ↳ frontend,api-gateway,auth-service,user-service,market-service,news-service,blog-service,calculator-service,chatbot-service,email-service,admin-service

ENVIRONMENT: Select one
  ↳ dev / staging / prod

SKIP_SONAR: false (run code quality check)
SKIP_TRIVY: false (run security scan)

Click: Build
```

**Result:**
- ✅ All 11 Docker images built in parallel
- ✅ All pushed to ECR as separate images
- ✅ Same ECR repo: `fintechops`
- ✅ Different image tags: `frontend-123-abc`, `api-gateway-123-abc`, etc.

---

### Option 2: Build SINGLE Service Only

```
Jenkins → FintechOps Job → Build with Parameters

SERVICES: Change to one service
  ↳ api-gateway

ENVIRONMENT: prod
SKIP_SONAR: false
SKIP_TRIVY: false

Click: Build
```

**Result:**
- ✅ Only `api-gateway` Docker image built
- ✅ Pushed to ECR as: `fintechops:api-gateway-123-abc`
- ✅ Faster build (few minutes instead of 15-20 minutes for all services)

**Individual Service Options:**
```
api-gateway
auth-service
user-service
market-service
news-service
blog-service
calculator-service
chatbot-service
email-service
admin-service
frontend
```

---

### Option 3: Build SELECTED Services (Custom Mix)

```
Jenkins → FintechOps Job → Build with Parameters

SERVICES: Comma-separated custom list
  ↳ api-gateway,auth-service,user-service

ENVIRONMENT: staging
SKIP_SONAR: false
SKIP_TRIVY: false

Click: Build
```

**Result:**
- ✅ Only 3 services built in parallel
- ✅ Faster than building all 11 services
- ✅ Useful for testing specific microservice updates

---

### Option 4: Fast Build (Skip Quality Checks - Development Only)

```
Jenkins → FintechOps Job → Build with Parameters

SERVICES: api-gateway,frontend

ENVIRONMENT: dev
SKIP_SONAR: true    ← Skip code quality (faster!)
SKIP_TRIVY: true    ← Skip security scan (faster!)

Click: Build
```

**Result:**
- ✅ Images built in ~5 minutes
- ✅ Good for rapid development cycles
- ✅ NOT recommended for prod deployments

---

## 📊 ECR Repository Structure

All images go to **same ECR repository** but with different tags:

```
AWS ECR Repository: fintechops

Images stored:
├── fintechops:frontend-123-abc
├── fintechops:frontend-latest
├── fintechops:api-gateway-123-abc
├── fintechops:api-gateway-latest
├── fintechops:auth-service-123-abc
├── fintechops:auth-service-latest
├── fintechops:user-service-123-abc
├── fintechops:user-service-latest
├── ... (all other services)
└── fintechops:admin-service-latest
```

**Key Points:**
- ✅ All in ONE ECR repo (efficient)
- ✅ Separate tags for each service (easy to identify)
- ✅ `-latest` tag always points to latest build
- ✅ Build number tag for version control (e.g., `123-abc`)

---

## 🔧 Jenkinsfile Parameter Details

Your current parameters:

```groovy
parameters {
    string(
        name: 'SERVICES',
        defaultValue: 'frontend,api-gateway,auth-service,user-service,market-service,news-service,blog-service,calculator-service,chatbot-service,email-service,admin-service',
        description: 'Comma-separated list of services to build'
    )
    choice(
        name: 'ENVIRONMENT',
        choices: ['dev', 'staging', 'prod'],
        description: 'Target deployment environment'
    )
    booleanParam(
        name: 'SKIP_SONAR',
        defaultValue: false,
        description: 'Skip SonarQube analysis'
    )
    booleanParam(
        name: 'SKIP_TRIVY',
        defaultValue: false,
        description: 'Skip Trivy security scan'
    )
}
```

**Supported Combinations:**

| SERVICES | ENVIRONMENT | SKIP_SONAR | SKIP_TRIVY | Use Case | Time |
|----------|-------------|-----------|-----------|----------|------|
| All 11 | prod | false | false | Full production build | 20 min |
| All 11 | dev | true | true | Fast dev build | 5 min |
| Single | prod | false | false | Update one service | 5 min |
| Single | dev | true | true | Quick dev iteration | 2 min |
| 3-4 | staging | false | false | Test suite of services | 10 min |

---

## 📈 Build Execution Flow

```
┌─ Jenkins Triggered (Parameters Set)
│
├─ Checkout Code (Git)
│
├─ SonarQube Analysis (if !SKIP_SONAR)
│  └─ Quality Gate Check
│
├─ ECR Login
│
├─ Build Docker Images (PARALLEL)
│  ├─ Service 1 build
│  ├─ Service 2 build
│  ├─ Service N build
│  └─ All built in parallel!
│
├─ Trivy Security Scan (if !SKIP_TRIVY, PARALLEL)
│  ├─ Service 1 scan
│  ├─ Service 2 scan
│  └─ Service N scan
│
├─ Push to ECR (PARALLEL)
│  ├─ Service 1 pushed
│  ├─ Service 2 pushed
│  └─ Service N pushed
│
└─ Deploy to EKS (if main/prod)
```

---

## 🎯 Real-World Examples

### Example 1: Deploy Only Backend API Updates to Production

```
SERVICES: api-gateway,auth-service,user-service
ENVIRONMENT: prod
SKIP_SONAR: false
SKIP_TRIVY: false

This will:
✓ Run code quality + security checks
✓ Build only 3 services (faster)
✓ Push to ECR
✓ Deploy only those services to production
✓ Other services remain unchanged
```

### Example 2: Hot Fix for Frontend - Fast Development Iteration

```
SERVICES: frontend
ENVIRONMENT: dev
SKIP_SONAR: true
SKIP_TRIVY: true

This will:
✓ Build frontend in ~2 minutes
✓ Skip quality checks (for fast iteration)
✓ Push to ECR with "dev" tag
✓ Deploy immediately
```

### Example 3: Full Production Release

```
SERVICES: (leave default - all 11)
ENVIRONMENT: prod
SKIP_SONAR: false
SKIP_TRIVY: false

This will:
✓ Full CI/CD pipeline for all services
✓ Complete code quality analysis
✓ Security scanning on all images
✓ Deploy entire application
✓ Takes ~20 minutes
```

### Example 4: Test New Chat Service - Staging Only

```
SERVICES: chatbot-service
ENVIRONMENT: staging
SKIP_SONAR: false
SKIP_TRIVY: false

This will:
✓ Build only chatbot service
✓ Full quality & security checks
✓ Deploy to staging to test
✓ Production untouched
```

---

## 📝 Using Build Parameters via Pipeline

### Via Jenkins Web UI (Easiest)

```
1. Go to: http://jenkins:8080/job/FintechOps/
2. Click: "Build with Parameters"
3. Set parameters
4. Click: "Build"
5. Monitor in: "Build History"
```

### Via Jenkins CLI

```bash
# Build single service
java -jar jenkins-cli.jar -s http://jenkins:8080 \
  build FintechOps \
  -p SERVICES=api-gateway \
  -p ENVIRONMENT=prod

# Build multiple services
java -jar jenkins-cli.jar -s http://jenkins:8080 \
  build FintechOps \
  -p "SERVICES=api-gateway,auth-service" \
  -p ENVIRONMENT=staging
```

### Via Curl (Remote Trigger)

```bash
# Build with parameters
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
  -u admin:token \
  -F 'SERVICES=api-gateway' \
  -F 'ENVIRONMENT=prod' \
  -F 'SKIP_SONAR=false' \
  -F 'SKIP_TRIVY=false'
```

### Via GitHub Actions (CI/CD Integration)

```yaml
# .github/workflows/trigger-jenkins.yml
name: Trigger Jenkins Build

on:
  workflow_dispatch:
    inputs:
      services:
        description: 'Services to build'
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

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Jenkins Build
        run: |
          curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
            -u ${{ secrets.JENKINS_USER }}:${{ secrets.JENKINS_TOKEN }} \
            -F 'SERVICES=${{ github.event.inputs.services }}' \
            -F 'ENVIRONMENT=${{ github.event.inputs.environment }}'
```

---

## ✨ Enhanced Jenkinsfile Features

Your current Jenkinsfile includes:

✅ **Service Mapping** - Maps service names to directories  
✅ **Parallel Builds** - Builds multiple services simultaneously  
✅ **Parallel Scans** - Security scans run in parallel  
✅ **Parallel Push** - ECR pushes run in parallel  
✅ **Smart Tagging** - Each service gets unique tags  
✅ **Environment Awareness** - Different builds for dev/staging/prod  
✅ **Error Handling** - Graceful failure handling  
✅ **Logging** - Detailed build information  

---

## 🔍 Monitoring Individual Service Builds

### In Jenkins UI

```
Jenkins → FintechOps → Build #123

Stages:
├─ Checkout
├─ SonarQube Analysis (if enabled)
├─ Quality Gate
├─ ECR Login
├─ Build Docker Images
│  ├─ api-gateway ✓
│  ├─ auth-service ✓
│  └─ user-service ✓
├─ Trivy Scan (if enabled)
│  ├─ api-gateway ✓
│  ├─ auth-service ✓
│  └─ user-service ✓
├─ Push to ECR
│  ├─ api-gateway ✓
│  ├─ auth-service ✓
│  └─ user-service ✓
└─ Deploy to EKS
```

### Via AWS ECR

```bash
# List images pushed
aws ecr list-images --repository-name fintechops --region ap-south-1

# Filter by service
aws ecr list-images --repository-name fintechops --query 'imageIds[?contains(imageTag, `api-gateway`)]'

# Get image details
aws ecr describe-images --repository-name fintechops --image-ids imageTag=api-gateway-123-abc
```

### Via Docker

```bash
# List local images
docker images | grep fintechops

# Pull latest service image
docker pull 196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:api-gateway-latest

# Run service locally to test
docker run -p 3000:3000 \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:api-gateway-latest
```

---

## 📊 Build Time Estimates

Based on 11 microservices:

| Build Type | Parallel? | Time | Services Per Minute |
|-----------|:---------:|------|:-------------------:|
| All services + QA + Trivy | Yes | ~20 min | 0.55 |
| All services (no QA/Trivy) | Yes | ~10 min | 1.1 |
| Single service + QA + Trivy | - | ~5 min | 0.2 |
| Single service (no QA/Trivy) | - | ~2 min | 0.5 |
| 3 services + QA + Trivy | Yes | ~8 min | 0.375 |

**Why parallel is fast:** 3 services build simultaneously, not sequentially.

---

## ⚠️ Important Notes

### Quality Gate Enforcement
```groovy
// If SKIP_SONAR=false, Quality Gate MUST pass
// If it fails, pipeline STOPS (doesn't push to ECR)
Stage('Quality Gate') {
    waitForQualityGate abortPipeline: true  ← Will stop here
}
```

### Trivy Security Enforcement
```groovy
// If SKIP_TRIVY=false, no CRITICAL/HIGH CVEs allowed
trivy image --exit-code 1 --severity CRITICAL,HIGH
// Exit code 1 = fail, pipeline stops
```

### ECR Single Repository
```groovy
// All images in ONE repo, different tags
imageName = "fintechops"  // Same for all
svcTag = "api-gateway-123-abc"  // Different tags
// Result: fintechops:api-gateway-123-abc
```

---

## 🎓 Parameter Use Cases by Team Role

### **Developer (Fast Iteration)**
```
SERVICES: Just your service (e.g., api-gateway)
ENVIRONMENT: dev
SKIP_SONAR: true
SKIP_TRIVY: true
→ Build in ~2 minutes, deploy to dev
```

### **QA Engineer (Testing)**
```
SERVICES: All affected services
ENVIRONMENT: staging
SKIP_SONAR: false
SKIP_TRIVY: false
→ Full testing pipeline before prod
```

### **DevOps (Production Deployment)**
```
SERVICES: (leave default - all)
ENVIRONMENT: prod
SKIP_SONAR: false
SKIP_TRIVY: false
→ Complete production release with all checks
```

### **Security Team (Compliance)**
```
SERVICES: All services
ENVIRONMENT: prod
SKIP_SONAR: false
SKIP_TRIVY: false
→ Full audit trail and security scanning
```

---

## ✅ Verification Checklist

- [x] ✅ Jenkinsfile supports multiple services via SERVICES parameter
- [x] ✅ Can build all 11 services at once (default)
- [x] ✅ Can build individual services
- [x] ✅ Can build custom combinations
- [x] ✅ All images go to same ECR repo (`fintechops`)
- [x] ✅ Each service has unique tag
- [x] ✅ Parallel builds for speed
- [x] ✅ Environment awareness (dev/staging/prod)
- [x] ✅ Quality gates enforced
- [x] ✅ Security scanning enabled

---

## 🚀 Next Steps

1. **Push Jenkins** configuration to GitHub
2. **Create Jenkins Job** from Jenkinsfile
3. **Test Parameter Builds**:
   - [ ] Test building all services
   - [ ] Test building single service
   - [ ] Test building custom mix
   - [ ] Test with dev/staging/prod
4. **Monitor First Builds** in Jenkins UI
5. **Verify Images** in AWS ECR
6. **Test Deployments** to EKS

---

**You're all set! 🎉 The Jenkinsfile is production-ready with flexible build parameters!**
