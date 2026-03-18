# Trivy Container Security Scanning

## 📋 Overview

Trivy is used in the CI/CD pipeline to scan Docker images for vulnerabilities before pushing to AWS ECR.

## 🔧 Installation

### Install Trivy

```bash
# macOS
brew install trivy

# Linux (Ubuntu/Debian)
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee -a /etc/apt/sources.list.d/trivy.list
apt-get update && apt-get install trivy

# Linux (RHEL/CentOS)
wget https://github.com/aquasecurity/trivy/releases/download/v0.48.0/trivy_0.48.0_Linux-64bit.rpm
rpm -ivh trivy_0.48.0_Linux-64bit.rpm

# Docker
docker run -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image <image-name>
```

## 🔍 Scanning Configuration

### Scan Command in Jenkinsfile

```groovy
stage('Trivy Scan') {
    when {
        expression { return !params.SKIP_TRIVY }
    }
    steps {
        script {
            sh '''
                trivy image \
                  --exit-code 1 \
                  --severity CRITICAL,HIGH \
                  --ignore-unfixed \
                  --format table \
                  --output trivy-results.txt \
                  ${ECR_REGISTRY}/${APP_NAME}:${SERVICE}-${IMAGE_TAG}
            '''
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'trivy-*.txt', allowEmptyArchive: true
        }
        failure {
            script {
                echo "🚨 CRITICAL/HIGH vulnerabilities detected!"
                emailext(
                    subject: "Trivy Scan Failed: ${APP_NAME}",
                    to: "${SECURITY_TEAM_EMAIL}",
                    attachmentsPattern: "trivy-results.txt"
                )
            }
        }
    }
}
```

## 📋 Trivy Configuration File

Create `.trivyignore` in root directory:

```yaml
# Trivy Ignore Rules
# Format: SEVERITY:PACKAGE:VERSION:VULNERABILITY_ID

# Known acceptable vulnerabilities (with justification)
LOW:npm:2024-0001:justification for acceptance

# Packages with grace period (fix in next release)
MEDIUM:lodash:*:lodash-vulnerability-123

# Third-party libraries - under review
HIGH:some-package:1.0.0:*
```

## 🛡️ Scan Severity Levels

| Severity | Action | Example |
|----------|--------|---------|
| CRITICAL | Block deployment | RCE vulnerabilities |
| HIGH | Review & Plan Fix | Authentication bypass |
| MEDIUM | Log & Monitor | DoS potential |
| LOW | Track | Information disclosure |
| INFO | Informational | Best practice violations |

## 📊 Trivy Output Formats

### Table Format (Human Readable)
```bash
trivy image --format table nginx:latest
```

### JSON Format (CI/CD Integration)
```bash
trivy image --format json --output trivy-report.json nginx:latest
```

### SARIF Format (GitHub Security Tab)
```bash
trivy image --format sarif --output trivy-report.sarif nginx:latest
```

### HTML Report
```bash
trivy image --format template --template '@contrib/html.tpl' \
  -o trivy-report.html nginx:latest
```

## 🔄 Local Scanning

### Scan Docker Images Before Push

```bash
# Build image locally
docker build -t myapp:1.0.0 .

# Scan with Trivy
trivy image \
  --severity CRITICAL,HIGH \
  --exit-code 1 \
  myapp:1.0.0

# If scan passes, push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com

docker tag myapp:1.0.0 196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:myapp-1.0.0
docker push 196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:myapp-1.0.0
```

## 📈 Baseline Scans

### Create Baseline for Repository

```bash
# Generate baseline report
trivy image --format json --output trivy-baseline.json myapp:latest

# Store in version control
git add trivy-baseline.json
git commit -m "chore: update trivy baseline"
```

### Compare Against Baseline

```bash
trivy image --baseline trivy-baseline.json myapp:new-version
```

## 🔐 Excluding Vulnerabilities

### Single Exclusion
```bash
trivy image \
  --skip-update \
  --severity CRITICAL,HIGH \
  --ignore-unfixed \
  myapp:latest
```

### Multiple Exclusions via File
```yaml
# .trivyignore
# Ignore specific CVE
CVE-2024-0001

# Ignore all vulnerabilities in package
npm@1.0.0
```

## 📊 Scanning Registries

### Scan in AWS ECR
```bash
# Authenticate with ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com

# Scan ECR image
trivy image \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:api-gateway-1.0.0
```

### Scan GitHub Container Registry
```bash
trivy image ghcr.io/youruser/fintechops:main
```

### Scan Docker Hub
```bash
trivy image nginx:latest
```

## 🔄 Scheduled Scans

### Scan all ECR repositories daily (Jenkins)

```groovy
pipeline {
    agent any
    
    triggers {
        cron('H 2 * * *') // 2 AM daily
    }
    
    stages {
        stage('Scan All ECR Images') {
            steps {
                script {
                    sh '''
                        aws ecr list-images --repository-name fintechops --region ap-south-1 \
                        --query 'imageIds[*].imageTag' --output text | \
                        tr '\t' '\n' | while read tag; do
                            echo "Scanning fintechops:$tag"
                            trivy image \
                              --severity CRITICAL,HIGH \
                              196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:$tag || true
                        done
                    '''
                }
            }
        }
    }
}
```

## 📤 Publishing Results

### Send to Security Dashboard
```bash
# Convert to JSON
trivy image --format json --output report.json myapp:latest

# Send to vulnerability tracker
curl -X POST http://security-dashboard:8080/api/vulnerabilities \
  -H "Content-Type: application/json" \
  -d @report.json
```

### Integration with SonarQube
```bash
# Parse and send to SonarQube
trivy image --format sarif --output report.sarif myapp:latest

# Process with custom script
./scripts/trivy-to-sonar.sh report.sarif
```

## 🚀 Performance Optimization

### Cache Database
```bash
# Download database once
trivy image --download-db-only

# Subsequent scans will use cached DB
trivy image myapp:latest
```

### Parallel Scanning
```bash
# Scan multiple images in parallel
for service in api-gateway auth-service user-service; do
    trivy image myapp:$service &
done
wait
```

### Skip Update Check
```bash
trivy image --skip-update myapp:latest
```

## 📝 Policy Enforcement

### Fail Build on Vulnerabilities

```bash
#!/bin/bash
set -e

# Scan and fail if CRITICAL vulnerabilities found
CRITICAL=$(trivy image \
  --severity CRITICAL \
  --format json \
  myapp:latest | jq '.Results[].Vulnerabilities | length')

if [ "$CRITICAL" -gt 0 ]; then
    echo "❌ CRITICAL vulnerabilities found: $CRITICAL"
    exit 1
fi

echo "✅ No critical vulnerabilities detected"
```

### Advanced Policy (Rego)

```json
# trivy-policy.json
{
  "type": "constraint",
  "metadata": {
    "id": "CVE-2024-0001",
    "title": "Block known critical CVE",
    "severity": "CRITICAL"
  },
  "match": {
    "vulnerability": {
      "id": "CVE-2024-0001"
    }
  },
  "actions": [
    "BLOCK"
  ]
}
```

## 🔗 Integration Points

### GitHub Action
```yaml
- name: Run Trivy scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myapp:latest'
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload to GitHub
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

### GitLab CI
```yaml
trivy_scan:
  stage: security
  script:
    - trivy image --exit-code 1 --severity CRITICAL,HIGH $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## 📚 Useful Commands

```bash
# Update vulnerability database
trivy image --download-db-only

# View trivy version
trivy version

# Generate HTML report
trivy image --format template --template '@contrib/html.tpl' \
  -o report.html myapp:latest

# Scan filesystem (not just images)
trivy fs --severity CRITICAL,HIGH .

# Debug mode (verbose output)
trivy image -v myapp:latest

# Scan with custom timeout
trivy image --timeout 5m0s myapp:latest
```

## ❓ Troubleshooting

### Issue: Database Download Timeout
```bash
Solution: Download manually first
trivy image --download-db-only
trivy image --skip-update myapp:latest
```

### Issue: CVE Not in Database
```bash
Solution: Update database
trivy image --download-db-only --refresh
```

### Issue: Authentication Fails for Private Registry
```bash
Solution: Configure Docker credentials
cat ~/.docker/config.json | trivy image --input - myapp:latest
```

### Issue: High False Positive Rate
```bash
Solution: 
1. Use .trivyignore to exclude known safe vulnerabilities
2. Enable --ignore-unfixed to hide unfixed CVEs
3. Adjust severity levels
```

## 📚 References

- [Trivy GitHub](https://github.com/aquasecurity/trivy)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Container Security Best Practices](https://aquasecurity.github.io/trivy/container-image/)
