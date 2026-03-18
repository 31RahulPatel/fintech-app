# 🚀 Jenkins Build Parameters - Quick Reference Card

## Copy & Paste These Commands

---

## 1️⃣ BUILD SINGLE SERVICE (Fast Development)

### API Gateway
```bash
# Via Jenkins Web UI:
SERVICES: api-gateway
ENVIRONMENT: dev
SKIP_SONAR: YES
SKIP_TRIVY: YES
Build → ~2 min

# Via Curl:
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' \
  -u admin:token \
  -F 'SERVICES=api-gateway' \
  -F 'ENVIRONMENT=dev' \
  -F 'SKIP_SONAR=true' \
  -F 'SKIP_TRIVY=true'
```

### Auth Service
```bash
SERVICES: auth-service
ENVIRONMENT: dev
SKIP_SONAR: YES
SKIP_TRIVY: YES
Build → ~2 min
```

### Frontend
```bash
SERVICES: frontend
ENVIRONMENT: dev
SKIP_SONAR: YES
SKIP_TRIVY: YES
Build → ~2 min
```

### Any Single Service
```bash
SERVICES: [any-service-name]
ENVIRONMENT: dev
SKIP_SONAR: YES
SKIP_TRIVY: YES
```

---

## 2️⃣ BUILD SINGLE SERVICE (Full Checks - Production)

### API Gateway with Full Checks
```bash
SERVICES: api-gateway
ENVIRONMENT: prod
SKIP_SONAR: NO
SKIP_TRIVY: NO
Build → ~5 min
```

### Auth Service with Full Checks
```bash
SERVICES: auth-service
ENVIRONMENT: prod
SKIP_SONAR: NO
SKIP_TRIVY: NO
Build → ~5 min
```

---

## 3️⃣ BUILD MULTIPLE SERVICES

### Frontend + API Gateway
```bash
SERVICES: frontend,api-gateway
ENVIRONMENT: staging
SKIP_SONAR: NO
SKIP_TRIVY: NO
Build → ~10 min
```

### Backend Services (Auth + User + Market)
```bash
SERVICES: auth-service,user-service,market-service
ENVIRONMENT: staging
SKIP_SONAR: NO
SKIP_TRIVY: NO
Build → ~10 min
```

### All Microservices (No Frontend)
```bash
SERVICES: api-gateway,auth-service,user-service,market-service,news-service,blog-service,calculator-service,chatbot-service,email-service,admin-service
ENVIRONMENT: staging
SKIP_SONAR: NO
SKIP_TRIVY: NO
Build → ~15 min
```

---

## 4️⃣ BUILD ALL SERVICES (Full Release)

```bash
SERVICES: (leave as default - all 11)
ENVIRONMENT: prod
SKIP_SONAR: NO
SKIP_TRIVY: NO
Build → ~20 min
```

---

## 5️⃣ ALL SERVICE NAMES (Comma-Separated)

```
frontend
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
```

**Add multiple:** `frontend,api-gateway,auth-service`

---

## 6️⃣ CURL COMMANDS (One-Liner)

### Single Service - Fast Dev
```bash
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' -u admin:token -F 'SERVICES=api-gateway' -F 'ENVIRONMENT=dev' -F 'SKIP_SONAR=true' -F 'SKIP_TRIVY=true'
```

### Single Service - Full Checks
```bash
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' -u admin:token -F 'SERVICES=api-gateway' -F 'ENVIRONMENT=prod' -F 'SKIP_SONAR=false' -F 'SKIP_TRIVY=false'
```

### Multiple Services
```bash
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' -u admin:token -F 'SERVICES=frontend,api-gateway' -F 'ENVIRONMENT=staging' -F 'SKIP_SONAR=false' -F 'SKIP_TRIVY=false'
```

### All Services
```bash
curl -X POST 'http://jenkins:8080/job/FintechOps/buildWithParameters' -u admin:token -F 'SERVICES=frontend,api-gateway,auth-service,user-service,market-service,news-service,blog-service,calculator-service,chatbot-service,email-service,admin-service' -F 'ENVIRONMENT=prod' -F 'SKIP_SONAR=false' -F 'SKIP_TRIVY=false'
```

---

## 7️⃣ TIME ESTIMATES

| Build Type | Time | Use Case |
|-----------|------|----------|
| Single service (dev, no checks) | ~2 min | Rapid iteration |
| Single service (prod, full) | ~5 min | Production single service |
| 3 services (staging, full) | ~10 min | Feature set testing |
| All 11 services (prod, full) | ~20 min | Full production release |

---

## 8️⃣ PARAMETER COMBINATIONS

### For Development 🚀
```
SERVICES: Your-service-name
ENVIRONMENT: dev
SKIP_SONAR: true
SKIP_TRIVY: true
→ Build in 2 minutes
```

### For Staging 🧪
```
SERVICES: Multiple related services
ENVIRONMENT: staging
SKIP_SONAR: false
SKIP_TRIVY: false
→ Build in 10 minutes with full checks
```

### For Production 📦
```
SERVICES: All 11 (or none - leave default)
ENVIRONMENT: prod
SKIP_SONAR: false
SKIP_TRIVY: false
→ Build in 20 minutes with all checks
```

---

## 9️⃣ WHAT GETS PUSHED TO ECR

All to **same repository** (`fintechops`), different tags:

```
fintechops:api-gateway-123-abc        ← Build 123, commit abc
fintechops:api-gateway-latest         ← Always latest
fintechops:frontend-123-abc
fintechops:frontend-latest
fintechops:auth-service-123-abc
fintechops:auth-service-latest
... etc for all services
```

**All in ONE repository = organized by tags**

---

## 🔟 MONITOR BUILD

```
Jenkins → FintechOps → Build #XXX → Console Output

View:
✓ Real-time build progress
✓ Parallel task execution
✓ Error messages
✓ Push status to ECR
```

---

## ✅ VALIDATION

After build completes:

```bash
# List images in ECR
aws ecr list-images --repository-name fintechops --region ap-south-1

# Check specific service
aws ecr list-images --repository-name fintechops \
  --query "imageIds[?contains(imageTag, 'api-gateway')]"

# Pull and test locally
docker pull 196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:api-gateway-latest
docker run -p 3000:3000 \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:api-gateway-latest
```

---

## ❓ COMMON QUESTIONS

**Q: Can I build just one service?**  
A: ✅ Yes! Set `SERVICES: api-gateway`

**Q: Can I build multiple services at once?**  
A: ✅ Yes! Set `SERVICES: api-gateway,frontend,auth-service`

**Q: Will building 11 services take 11x longer?**  
A: ❌ No! They build in parallel = same time as 1 service

**Q: Can I skip quality checks?**  
A: ✅ Yes! Set `SKIP_SONAR: true` and `SKIP_TRIVY: true` (dev only)

**Q: Do all images go to same ECR repo?**  
A: ✅ Yes! Same repo, different tags (by service name)

**Q: What if service name is wrong?**  
A: ⚠️ Jenkins skips it (shows warning)

**Q: Can I deploy just one service to production?**  
A: ✅ Yes! Build it, push to ECR, let Kubernetes pick it up

---

## 🚀 TL;DR (Too Long; Didn't Read)

```
Just Push These Buttons in Jenkins:

Development (Fast):
├─ Service: api-gateway
├─ Environment: dev
├─ Skip Sonar: ✓
├─ Skip Trivy: ✓
└─ BUILD → Deploys in 2 minutes

Production (Full):
├─ Leave all defaults
├─ Environment: prod
├─ Skip Sonar: (uncheck)
├─ Skip Trivy: (uncheck)
└─ BUILD → Full CI/CD in 20 minutes
```

---

## 📞 Need Help?

```
Build not working? → Check Jenkins console output
Image not in ECR? → Verify AWS credentials
Quality gate failed? → Check SonarQube dashboard
Security scan failed? → Check trivy-results.txt artifact
```

---

**That's it! You're ready to build any combination of services! 🎉**
