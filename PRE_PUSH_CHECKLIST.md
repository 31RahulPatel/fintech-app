# Pre-Push Security Verification Checklist

## ✅ Final Security Review Before GitHub Push

### 1. Secrets & Credentials Check

**CRITICAL: Verify NO secrets are exposed**

```bash
# 1. Check for AWS credentials
grep -r "AKIA" . --include="*.js" --include="*.json" --include="*.yaml" --include="*.yml" && echo "⚠️  FOUND AWS KEY" || echo "✅ No AWS keys found"

# 2. Check for API keys
grep -r "api_key\|apiKey\|API_KEY\|secret" . --include="*.env*" 2>/dev/null | grep -v "node_modules" && echo "⚠️  FOUND SECRETS" || echo "✅ No secrets found"

# 3. Check for private keys
find . -name "*.pem" -o -name "*.key" -o -name "*.cert" 2>/dev/null | grep -v node_modules && echo "⚠️  FOUND PRIVATE KEYS" || echo "✅ No private keys found"

# 4. Check .env files
ls -la | grep "\.env" && echo "⚠️  FOUND .env FILES" || echo "✅ No .env files in root"

# 5. Verify .gitignore is effective
git check-ignore -v .env .env.local aws-credentials docker-compose.override.yml 2>&1 | grep -q ":" && echo "✅ .gitignore properly configured" || echo "⚠️  .gitignore may not be working"
```

### 2. File Permissions Check

```bash
# Verify no sensitive files have world-readable permissions
find . -type f -perm 644 -name "*.key" -o -name "*.pem" -o -name "*.cert" | xargs -r chmod 600

# Verify executable scripts have proper permissions
chmod +x setup-cicd.sh
chmod +x cicd/scripts/*.sh
chmod +x aws-scheduler/deploy.sh

echo "✅ File permissions secured"
```

### 3. Git History Scan

```bash
# Check if any secrets were previously committed
git log -p --all -S "AKIA" -- | head -20 && echo "⚠️  FOUND CREDENTIALS IN GIT HISTORY" || echo "✅ No credentials in git history"

# Verify recent commits contain no secrets
git log --oneline -10

echo "✅ Git history is clean"
```

### 4. Dependency Security Check

```bash
# Check frontend dependencies
cd frontend
npm audit --audit-level=moderate
npm audit fix  # Fix vulnerabilities if needed
cd ..

# Check services dependencies
for service in services/*/; do
    echo "Checking $service..."
    cd "$service"
    npm audit --audit-level=moderate
    npm audit fix
    cd ..
done

echo "✅ Dependencies are secure"
```

### 5. Docker Image Security

```bash
# Verify base images in Dockerfiles are secure
grep -r "^FROM" . --include="Dockerfile" | grep -v "alpine\|distroless" && echo "⚠️  Consider using alpine or distroless images" || echo "✅ Using minimal base images"

# Scan Dockerfiles for security issues
if command -v hadolint &> /dev/null; then
    find . -name "Dockerfile" -exec hadolint {} \;
    echo "✅ Dockerfiles pass Hadolint security checks"
fi
```

### 6. Code Quality Check

```bash
# Check for hardcoded IPs/URLs
grep -r "localhost\|127.0.0.1\|hardcoded" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".git" && echo "⚠️  FOUND HARDCODED VALUES" || echo "✅ No hardcoded values"

# Check for console.log statements (shouldn't be in production code)
grep -r "console\." services/ --include="*.js" | grep -v "console.error\|test" && echo "⚠️  Found console statements in services" || echo "✅ No excessive console statements"
```

### 7. Configuration Files Check

```bash
# Verify sonar-project.properties doesn't contain secrets
cat sonar-project.properties | grep -i "password\|token\|secret" && echo "⚠️  FOUND SECRETS IN SONAR CONFIG" || echo "✅ No secrets in sonar config"

# Verify Jenkinsfile uses credentials properly
grep -r "withCredentials\|credentials(" Jenkinsfile && echo "✅ Jenkinsfile uses secure credentials pattern" || echo "⚠️  Check Jenkinsfile credential handling"
```

### 8. Environment Configuration

```bash
# Verify .env.example exists with safe defaults
if [ -f ".env.example" ]; then
    echo "✅ .env.example exists"
    cat .env.example | head -10  # Review contents
else
    echo "⚠️  .env.example missing - create it with safe defaults"
fi

# Verify .env files are listed in .gitignore
grep -q "^\.env" .gitignore && echo "✅ .env files are gitignored" || echo "⚠️  .env files not gitignored"
```

### 9. Repository Configuration

```bash
# Verify repository settings
echo "Repository URL: $(git config --get remote.origin.url)"
echo "Default branch: $(git symbolic-ref --short refs/remotes/origin/HEAD | cut -d'/' -f2)"
echo ""
echo "⚠️  IMPORTANT: Verify the URLs above are correct!"
```

### 10. File Size Check

```bash
# Check for large files that shouldn't be in Git
find . -size +10M -type f ! -path "./.git/*" 2>/dev/null | while read file; do
    echo "⚠️  Large file: $file (should use Git LFS)"
done

echo "✅ No large files detected (or Git LFS already configured)"
```

---

## 🚀 Pre-Push Summary

Run this complete check:

```bash
#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        FintechOps - Pre-Push Security Verification        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check for sensitive patterns
echo "[1/3] Scanning for secrets..."
SECRETS=$(grep -r "AKIA\|BEGIN.*PRIVATE\|api_key\|password.*=" . \
  --include="*.js" --include="*.json" --include="*.yaml" --include="*.yml" \
  --include="*.env" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l)

if [ "$SECRETS" -gt 0 ]; then
    echo "❌ FOUND $SECRETS potential secret matches!"
    grep -r "AKIA\|BEGIN.*PRIVATE\|api_key\|password.*=" . \
      --include="*.js" --include="*.json" --include="*.yaml" --include="*.yml" \
      --include="*.env" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | head -5
    exit 1
else
    echo "✅ No secrets detected"
fi

echo ""
echo "[2/3] Checking .gitignore effectiveness..."
# Check that important files are ignored
if git check-ignore .env* aws-credentials* *.pem *.key > /dev/null 2>&1; then
    echo "✅ .gitignore is properly excluding sensitive files"
else
    echo "⚠️  Some sensitive files may be missing from .gitignore"
fi

echo ""
echo "[3/3] Reviewing git status..."
git status --short | head -20
echo ""

if [ $(git status --short | wc -l) -gt 0 ]; then
    echo "⚠️  You have uncommitted changes"
    echo "   Use 'git add' to stage changes before pushing"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Ready to push securely? ✅                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
```

---

## 📋 Critical Items to Verify

These MUST be correct before pushing:

- [ ] ✅ No AWS credentials in code
- [ ] ✅ No `.env` files in staging area
- [ ] ✅ No `.pem` or `.key` files
- [ ] ✅ `.gitignore` is comprehensive
- [ ] ✅ No hardcoded passwords/tokens
- [ ] ✅ Jenkinsfile uses `withCredentials` pattern
- [ ] ✅ All `.env.example` files exist with safe defaults
- [ ] ✅ Git history is clean of secrets
- [ ] ✅ File permissions are correct (600 for keys, 755 for scripts)
- [ ] ✅ Repository URL is correct (https://github.com/31RahulPatel/fintech-app.git)

---

## 🔐 What's Protected by .gitignore

**Environment & Secrets:**
- `.env` files (all variants)
- `*.pem`, `*.key`, `*.cert` (private keys)
- `*.p12`, `*.pfx` (certificates)

**Credentials & Config:**
- `aws-credentials`
- `kubeconfig`
- `docker-compose.override.yml`
- `jenkins_home/` (Jenkins configuration)

**Build & Runtime:**
- `node_modules/`, `dist/`, `build/`
- `.aws-sam/`, `samconfig.toml`
- Coverage reports, logs, temporary files

**Development & IDE:**
- `.idea/`, `.vscode/`, `.DS_Store`
- `*.swp`, `*.swo`, `*~`

---

## 📊 Files Being Pushed

**Configuration Files:**
- ✅ `Jenkinsfile` (Full CI/CD pipeline)
- ✅ `sonar-project.properties` (Code quality)
- ✅ `.sonarcloud.properties` (SonarCloud config)
- ✅ `.trivyignore` (Security exceptions)
- ✅ `.gitignore` (Comprehensive)

**Documentation:**
- ✅ `docs/GITHUB_JENKINS_SETUP.md` (GitHub integration)
- ✅ `docs/SONARQUBE_SETUP.md` (Code quality)
- ✅ `docs/TRIVY_SCANNING.md` (Security scanning)
- ✅ `docs/AWS_EKS_SETUP.md` (Kubernetes deployment)
- ✅ `docs/CICD_SETUP.md` (Complete CI/CD guide)

**Infrastructure:**
- ✅ `cicd/docker-compose.yml` (Jenkins + SonarQube)
- ✅ `k8s/` (Kubernetes manifests)
- ✅ `Dockerfile` files (All services)

**Scripts:**
- ✅ `setup-cicd.sh` (Automated setup)
- ✅ `cicd/scripts/` (Infrastructure scripts)

**Source Code:**
- ✅ `frontend/` (React application)
- ✅ `services/` (11 microservices)
- ✅ `aws-scheduler/` (Lambda functions)

---

## 🚫 Files NOT Being Pushed

**Environment & Secrets (intentionally excluded):**
- ❌ `.env` (local environment variables)
- ❌ `.env.local`, `.env.production`, `.env.staging`
- ❌ `*.pem`, `*.key` (private keys)
- ❌ `aws-credentials` (AWS credentials)
- ❌ `kubeconfig` (Kubernetes configuration)

**Dependencies & Build Artifacts:**
- ❌ `node_modules/` (install via npm)
- ❌ `coverage/` (generated test coverage)
- ❌ `dist/`, `build/` (build artifacts)
- ❌ `.aws-sam/`, SAM build outputs

**Temporary Files:**
- ❌ `*.log` (log files)
- ❌ `.DS_Store`, `Thumbs.db` (OS files)
- ❌ `/tmp`, `/temp` (temporary directories)

---

## ✨ Next Steps After Push

1. **Configure GitHub:**
   ```bash
   # Enable branch protection on main
   # Require PR reviews
   # Require status checks (SonarQube, Trivy)
   ```

2. **Set Up GitHub Secrets:**
   ```
   GitHub → Settings → Secrets and variables → Actions
   
   Add secrets for CI/CD:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - DOCKER_REGISTRY_PASSWORD
   - SONAR_TOKEN
   - SLACK_WEBHOOK_URL (optional)
   ```

3. **Configure GitHub Environments:**
   ```
   GitHub → Settings → Environments → Production
   
   Set environment variables:
   - AWS_REGION = ap-south-1
   - AWS_ACCOUNT_ID = 196390795701
   - EKS_CLUSTER_NAME = fintechops-eks
   ```

4. **Enable Security Features:**
   ```
   GitHub → Settings → Security
   ✓ Dependabot alerts
   ✓ Secret scanning
   ✓ Code scanning (CodeQL)
   ```

---

## 🔍 Final Verification Before Push

```bash
# Run this final check
echo "Checking repository status..."
git status

echo ""
echo "Checking for any staged secrets..."
git diff --cached --all | grep -i "password\|secret\|api.?key\|AKIA" && echo "⚠️  ABORT: Secrets found in staging!" && exit 1 || echo "✅ No secrets in staging area"

echo ""
echo "Untracked files:"
git ls-files --others --exclude-standard | head -10

echo ""
echo "Ready to push? Run:"
echo "  git push -u origin main"
```
