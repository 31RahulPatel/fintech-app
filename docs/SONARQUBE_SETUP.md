# SonarQube Quality Gates Setup

## 📋 Overview

This document describes the SonarQube integration for code quality analysis throughout the CI/CD pipeline.

## 🔧 Installation & Configuration

### 1. SonarQube Server Setup

The SonarQube server runs in Docker. See `cicd/docker-compose.yml`:

```yaml
sonarqube:
  image: sonarqube:latest
  ports:
    - "9000:9000"
  environment:
    - SONAR_JDBC_URL=jdbc:postgresql://postgres:5432/sonarqube
    - SONAR_JDBC_USERNAME=sonar
    - SONAR_JDBC_PASSWORD=${SONAR_DB_PASSWORD}
```

### 2. Initial Setup

```bash
# Access SonarQube at http://localhost:9000
# Default login: admin/admin (change immediately)

# Create a new project:
# 1. Projects → Create project
# 2. Set Project Key: fintechops
# 3. Generate a token for Jenkins
```

### 3. Jenkins Integration

**Required Jenkins Credentials:**
- `sonar-token`: SonarQube API token (secret text)

**Jenkins Configuration:**
1. Manage Jenkins → System
2. SonarQube servers:
   - Name: `SonarQube`
   - Server URL: `http://sonarqube:9000`
   - Server authentication token: `sonar-token`

### 4. Quality Gate Configuration

**In SonarQube UI:**

1. **Create Quality Gate:**
   - Quality Gates → Create
   - Name: `FintechOps-QG`

2. **Add Conditions:**

   ```
   Reliability:
   - Bugs > 5 → FAIL
   - Code Smells > 50 → FAIL
   
   Security:
   - Vulnerabilities > 0 → FAIL
   - Security Hotspots Reviewed < 80% → FAIL
   
   Maintainability:
   - Duplication > 10% → FAIL
   - Technical Debt Ratio > 5% → FAIL
   - SQALE Rating worse than: A → FAIL
   
   Coverage:
   - Line Coverage < 60% → FAIL
   ```

3. **Set as Default:**
   - Click "Set as Default" on the Quality Gate

## 🔍 Analysis Configuration

### SonarQube Scanner Properties

File: `.sonarcloud.properties` / `sonar-project.properties`

```properties
# Project identification
sonar.projectKey=fintechops
sonar.projectName=FintechOps

# Source code
sonar.sources=frontend/src,services
sonar.exclusions=**/node_modules/**,**/coverage/**,**/build/**,**/dist/**

# Test coverage
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info

# Encoding
sonar.sourceEncoding=UTF-8
```

### Running Analysis

**Via Jenkins (Automatic):**
```groovy
stage('SonarQube Analysis') {
    withSonarQubeEnv('SonarQube') {
        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
            sh '''
                sonar-scanner \
                  -Dsonar.projectKey=fintechops \
                  -Dsonar.sources=frontend/src,services \
                  -Dsonar.login=$SONAR_TOKEN
            '''
        }
    }
    waitForQualityGate abortPipeline: true
}
```

**Manual Local Analysis:**
```bash
# Install SonarScanner
npm install -g sonarqube-scanner

# Run analysis
sonarqube-scanner \
  -Dsonar.projectKey=fintechops \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://sonarqube:9000 \
  -Dsonar.login=<your-token>
```

## 📊 Dashboard & Reports

Access at: `http://sonarqube:9000/dashboard?id=fintechops`

### Key Metrics

- **Reliability**: Bugs and defects
- **Security**: Vulnerabilities and hotspots
- **Maintainability**: Technical debt and code smells
- **Coverage**: Unit test code coverage

### Filtering Issues

- **By Language**: JavaScript/React
- **By Type**: Bug, Code Smell, Vulnerability
- **By Severity**: Blocker, Critical, Major, Minor, Info
- **By Status**: Open, Confirmed, Resolved, Reopened

## 🚫 Quality Gate Failure Handling

### When Quality Gate Fails:

1. **Jenkins Pipeline Aborts:**
   ```
   Pipeline Status: FAILURE
   Build marked as FAILED
   ```

2. **Developer Actions:**
   ```bash
   # View issues
   sonar-scanner report: http://sonarqube:9000/project/issues

   # Fix code issues locally
   git commit -m "fix: resolve SonarQube issues"
   git push
   ```

3. **Retry Build:**
   - Fix issues
   - Push changes
   - Jenkins autotrriggers on webhook

### Bypassing Quality Gate (NOT RECOMMENDED):

```groovy
// In Jenkinsfile (use with caution):
waitForQualityGate abortPipeline: false  // Non-blocking
```

## 🔐 Security & Access Control

### Role-Based Access:

```
- Administrator: Full access
- Developers: View dashboards, browse issues
- QA: Manage issues
```

### Token Management:

```bash
# Generate user token (in SonarQube UI)
My Account → Security → Generate Tokens

# Environment variable:
export SONAR_TOKEN="squ_xxxxx"
```

## 📈 Performance Tuning

### Database Optimization:

```sql
-- PostgreSQL configuration in docker-compose.yml
environment:
  - PostgreSQL max_connections: 200
  - shared_buffers: 256MB
```

### Scanning Performance:

```properties
# Parallel analysis (for large projects)
sonar.analysis.mode=issues
sonar.sourceEncoding=UTF-8

# Exclude large folders
sonar.exclusions=**/node_modules/**,**/migrations/**
```

## 🔗 Integration with GitHub

### GitHub PR Analysis:

```groovy
// Automatic PR analysis
stage('SonarQube PR Analysis') {
    when { changeRequest() }
    steps {
        withSonarQubeEnv('SonarQube') {
            sh '''
                sonar-scanner \
                  -Dsonar.pullrequest.key=$CHANGE_ID \
                  -Dsonar.pullrequest.branch=$CHANGE_BRANCH \
                  -Dsonar.pullrequest.base=main
            '''
        }
    }
}
```

### PR Decoration:

- Comments on PRs with issues found
- Integrates with GitHub status checks
- Blocks merge if Quality Gate fails

## 📚 Useful Commands

```bash
# Start SonarQube (Docker)
docker-compose -f cicd/docker-compose.yml up -d sonarqube

# View logs
docker-compose logs -f sonarqube

# Reset admin password
docker exec sonarqube-container curl -X POST \
  http://localhost:9000/api/users/change_password \
  -d "login=admin&password=newpassword"

# Backup database
docker exec sonarqube-postgres pg_dump sonarqube > sonarqube_backup.sql
```

## ❓ Troubleshooting

### Issue: Quality Gate Not Found
```
Solution: Create Quality Gate in SonarQube UI → Set as default
```

### Issue: Coverage Not Detected
```
Solution: Ensure LCOV files are generated before sonar-scanner runs
- npm test -- --coverage (generate lcov.info)
```

### Issue: Timeout During Analysis
```
Solution: Increase timeout in Jenkinsfile
waitForQualityGate abortPipeline: true, timeout: 10 // minutes
```

### Issue: Cannot Connect to SonarQube
```
Solution: 
- Check Docker network: docker network ls
- Verify sonar-project.properties has correct host URL
- Check firewall: port 9000 open
```

## 📝 Next Steps

1. Create Quality Gate in SonarQube UI
2. Generate API token for Jenkins
3. Add `sonar-token` credential in Jenkins
4. Run first SonarQube analysis from Jenkins
5. Monitor dashboards and fix code issues
