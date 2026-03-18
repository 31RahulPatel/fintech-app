# GitHub → Jenkins → SonarQube → ECR → EKS CI/CD Pipeline Setup

## 📋 Overview

Complete guide to set up the continuous integration and deployment pipeline from GitHub to AWS EKS with quality gates and security scanning.

## 🏗️ Pipeline Architecture

```
GitHub Webhook
     ↓
Jenkins Pipeline
     ├─→ Checkout Code
     ├─→ SonarQube Analysis
     ├─→ Quality Gate
     ├─→ Build Docker Images (parallel)
     ├─→ Trivy Security Scan
     ├─→ ECR Push
     └─→ EKS Deployment
```

## 🔧 Step 1: GitHub Repository Setup

### 1.1 Create GitHub Repository

```bash
# Create new repository at https://github.com/31RahulPatel/fintechapp

# Initialize if new
git init
git add .
git commit -m "Initial commit: FintechOps microservices"
git branch -M main
git remote add origin https://github.com/31RahulPatel/fintechapp.git
git push -u origin main
```

### 1.2 Create GitHub Personal Access Token

```bash
# Instructions:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Name: jenkins-token
4. Scopes: repo, admin:repo_hook, admin:org_hook
5. Expiry: 90 days
6. Generate and COPY TOKEN
```

### 1.3 Add GitHub Branch Protection Rules

```bash
# On GitHub:
1. Repository → Settings → Branches
2. Add rule for 'main' and 'staging'
3. Enable:
   ✓ Require pull request reviews before merging
   ✓ Dismiss stale pull request approvals
   ✓ Require status checks to pass:
     - Jenkins/SonarQube Quality Gate
     - Trivy Security Scan
   ✓ Require branches to be up to date
   ✓ Include administrators
```

### 1.4 Create Environment Variables

```bash
# GitHub Settings → Environments → Production

# Environment Variables:
AWS_ACCOUNT_ID=196390795701
AWS_REGION=ap-south-1
ECR_REGISTRY=196390795701.dkr.ecr.ap-south-1.amazonaws.com

# Environment Secrets:
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
```

## 🚀 Step 2: Jenkins Server Setup

### 2.1 Deploy Jenkins Infrastructure

#### Option A: Docker Compose (Recommended for Dev/Staging)

```bash
# Start Jenkins and SonarQube
cd cicd
docker-compose up -d

# Wait for Jenkins to initialize (30-60 seconds)
docker-compose logs -f jenkins

# Access Jenkins at http://localhost:8080
```

#### Option B: EC2 Instance (Production)

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.large \
  --key-name jenkins-key \
  --security-groups jenkins-sg \
  --subnet-id subnet-xxxxx

# Install Docker on EC2
ssh -i jenkins-key.pem ec2-user@<instance-ip>

sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# Clone repo and start
git clone https://github.com/31RahulPatel/fintechapp.git
cd fintechapp/cicd
docker-compose up -d
```

#### Option C: EKS Jenkins (Kubernetes-native)

```bash
# Install Jenkins Helm chart
helm repo add jenkins https://charts.jenkins.io
helm repo update

helm install jenkins jenkins/jenkins \
  --namespace jenkins --create-namespace \
  -f jenkins-values.yaml

# Port forward for configuration
kubectl port-forward -n jenkins svc/jenkins 8080:8080
```

### 2.2 Configure Jenkins

#### Initial Setup

```
1. Open Jenkins: http://localhost:8080
2. Get admin password: docker logs jenkins | grep "Please use the following password"
3. Set up admin account
4. Install suggested plugins:
   ✓ Git
   ✓ Pipeline
   ✓ GitHub Integration
   ✓ SonarQube Scanner
   ✓ Kubernetes
   ✓ Docker
```

### 2.3 Configure Jenkins Credentials

```groovy
// Jenkins → Manage Jenkins → Manage Credentials → System

// 1. GitHub Token (Secret text)
ID: github-token
Secret: ghp_xxxxxxxxxxxxxxxx

// 2. GitHub Username/Password (Username/Password credentials)
ID: github-credentials
Username: 31RahulPatel
Password: <personal-access-token>

// 3. AWS Credentials
ID: aws-credentials
Access Key: AKIA...
Secret Key: xxxxxxx

// 4. SonarQube Token
ID: sonar-token
Secret: squ_xxxxxxxx

// 5. Docker Registry (Username/Password)
ID: docker-registry
Username: AWS
Password: <AWS ECR password>
```

### 2.4 Configure GitHub Webhook

```groovy
// In Jenkinsfile repository settings
Manage Jenkins → Configure System → GitHub

// GitHub Server:
- API URL: https://api.github.com
- Credentials: github-token
- Test connection
```

### 2.5 Create Pipeline Job

```groovy
// Jenkins → New Item → Pipeline

Item name: FintechOps
Type: Pipeline

// Pipeline section:
Definition: Pipeline script from SCM
SCM: Git
Repository URL: https://github.com/31RahulPatel/fintechapp.git
Credentials: github-credentials
Branch: main
Script path: Jenkinsfile

// Build Triggers:
✓ GitHub hook trigger for GITScm polling
```

### 2.6 Add GitHub Webhook

```bash
# GitHub Repository → Settings → Webhooks → Add webhook

Payload URL: http://jenkins-server:8080/github-webhook/
Content type: application/json
Events: Push events + Pull Request
Active: ✓

# Jenkins will automatically detect webhook
# Verify: Jenkins → Manage Jenkins → Manage plugins (GitHub plugin)
```

## 🔐 Step 3: Credentials & Secrets Management

### 3.1 AWS Credentials

```bash
# Create IAM user for Jenkins
aws iam create-user --user-name jenkins-ci

# Create access keys
aws iam create-access-key --user-name jenkins-ci

# Attach policies
aws iam attach-user-policy \
  --user-name jenkins-ci \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-user-policy \
  --user-name jenkins-ci \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSFullAccess

aws iam attach-user-policy \
  --user-name jenkins-ci \
  --policy-arn arn:aws:iam::aws:policy/IAMReadOnlyAccess

# Store credentials in Jenkins
# Jenkins → Manage Credentials → AWS Credentials
```

### 3.2 SonarQube Token

```bash
# In SonarQube UI (http://sonarqube:9000)
1. Click Profile (top right)
2. My Account → Security → Generate Token
3. Name: jenkins-token
4. Copy token
5. Add to Jenkins credentials
```

### 3.3 Docker Registry (ECR)

```bash
# Generate ECR login token (Jenkins can do this via AWS CLI)
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com
```

## 🔄 Step 4: Pipeline Execution Flow

### 4.1 Build Trigger

```bash
# Push to GitHub
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub webhook sends POST to Jenkins
# Jenkins automatically triggers pipeline
```

### 4.2 Pipeline Stages Execution

#### Stage 1: Checkout
```groovy
stage('Checkout') {
    checkout scm  // Clones repository
    // Sets env variables: GIT_COMMIT_SHORT, IMAGE_TAG, etc.
}
```

#### Stage 2: SonarQube Analysis
```groovy
stage('SonarQube Analysis') {
    withSonarQubeEnv('SonarQube') {
        sh 'sonar-scanner ...'  // Analyzes code
    }
}
```

#### Stage 3: Quality Gate
```groovy
stage('Quality Gate') {
    timeout(time: 5, unit: 'MINUTES') {
        waitForQualityGate abortPipeline: true  // Blocks if gate fails
    }
}
```

#### Stage 4: Build Images
```groovy
stage('Build Docker Images') {
    // Builds 11 services in parallel
    parallel { ... }  // Reduces build time significantly
}
```

#### Stage 5: Trivy Scan
```groovy
stage('Trivy Scan') {
    // Scans each image for HIGH/CRITICAL CVEs
    // Fails if critical vulnerabilities found
}
```

#### Stage 6: Push to ECR
```groovy
stage('Push to ECR') {
    // Pushes docker images to AWS ECR
    docker push ${ECR_REGISTRY}/fintechops:${service}-${tag}
}
```

#### Stage 7: Deploy to EKS
```groovy
stage('Deploy to EKS') {
    // Via Kustomize or ArgoCD
    kubectl apply -k k8s/overlays/production/
}
```

### 4.3 Monitor Build Progress

```bash
# Jenkins UI: http://localhost:8080
1. Click on job
2. Monitor build stages in real-time
3. View console output
4. Check artifact reports

# Command line
curl -s http://localhost:8080/api/json | jq '.jobs[] | {name, url, lastBuild}'
```

## 📊 Step 5: Quality Gates Configuration

### 5.1 SonarQube Quality Gate

```bash
# Already configured in sonar-project.properties
# Default Quality Gate conditions:
- Bugs > 5 → FAIL
- Vulnerabilities > 0 → FAIL
- Code Coverage < 60% → FAIL
```

### 5.2 GitHub Status Checks

```bash
# GitHub Integration:
1. Commit status auto-updated by SonarQube
2. Trivy results posted as check run
3. Additional checks via GitHub Actions

# Screenshot: repository/settings/branches/protection
✓ Require status checks to pass before merging:
  - SonarQube Quality Gate
  - Trivy Security Scan
```

### 5.3 Handling Failed Checks

#### If SonarQube Gate Fails:

```bash
# View issues
1. SonarQube Dashboard → Issues
2. Filter by: New, Priority
3. Fix issues locally:

git checkout main
git pull
# Fix code issues
git add .
git commit -m "fix: resolve sonarqube issues"
git push

# Pipeline auto-retriggers
```

#### If Trivy Scan Fails:

```bash
# View trivy report
1. Jenkins → Build → Artifacts → trivy-results.txt
2. Review CVEs
3. Either:
   a) Update base image (e.g., node:latest → node:alpine)
   b) Add to .trivyignore with justification
   c) Wait for package update that fixes CVE

# Retry
git edit .trivyignore  # Or update Dockerfile
git commit -am "fix: address trivy vulnerabilities"
git push
```

## 🔍 Step 6: Monitoring & Reporting

### 6.1 Jenkins Dashboard

```
Jenkins → Manage Jenkins → Dashboard

Widgets:
- Recent builds
- Build queue
- Executor status
- Test results trending
```

### 6.2 SonarQube Dashboard

```
http://sonarqube:9000/dashboard?id=fintechops

Displays:
- Code metrics (LOC, complexity)
- Quality Gate status
- Issues by type/severity
- Coverage trends
```

### 6.3 Build Notifications

#### Email Notifications
```groovy
post {
    failure {
        emailext(
            subject: "Build Failed: ${env.BUILD_TAG}",
            to: 'team@example.com',
            attachmentsPattern: 'trivy-*.txt',
            body: '''
                Build ${BUILD_TAG} failed at ${BUILD_LOG_EXCERPT}
                View: ${BUILD_URL}
            '''
        )
    }
}
```

#### Slack Notifications
```groovy
post {
    always {
        slackSend(
            channel: '#cicd-alerts',
            message: "${env.JOB_NAME} - ${env.BUILD_NUMBER}: ${currentBuild.result}",
            color: currentBuild.result == 'SUCCESS' ? 'good' : 'danger'
        )
    }
}
```

## 🔄 Step 7: Automated Deployment

### 7.1 Deploy to Production

```groovy
stage('Deploy to Production') {
    when {
        branch 'main'
    }
    steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding']]) {
            sh '''
                aws eks update-kubeconfig --name fintechops-eks
                kubectl apply -k k8s/overlays/production/
                kubectl rollout status deployment -n production
            '''
        }
    }
}
```

### 7.2 Deploy to Staging

```groovy
stage('Deploy to Staging') {
    when {
        branch 'staging'
    }
    steps {
        sh '''
            aws eks update-kubeconfig --name fintechops-eks
            kubectl apply -k k8s/overlays/staging/
        '''
    }
}
```

### 7.3 Manual Approval for Production

```groovy
stage('Approval') {
    when { branch 'main' }
    steps {
        input 'Deploy to production?'
    }
}
```

## 📈 Best Practices

### 1. Branch Protection

```bash
# main branch: all checks required
# staging branch: SonarQube, Trivy required
# feature/* branches: SonarQube optional, Trivy optional
```

### 2. Secrets Management

```bash
# Use Jenkins credentials, NOT in Jenkinsfile
✓ Good:  withCredentials([...]) { ... }
✗ Bad:   sh "docker login -u AWS -p ${AWS_PASSWORD}"

# Rotate credentials regularly
# Delete unused credentials
```

### 3. Performance Optimization

```bash
# Parallel builds
# Caching (Docker layer caching)
# Artifact caching
# Avoid unnecessary full rebuilds
```

### 4. Security Hardening

```groovy
// Scan images before push
trivy image --exit-code 1 --severity CRITICAL,HIGH ...

// Sign images
docker image sign $IMAGE_NAME

// Use RBAC in Kubernetes
```

## 📚 Troubleshooting

### Issue: Webhook Not Triggering

```bash
# Check GitHub Webhook
1. GitHub → Settings → Webhooks
2. Click webhook → Recent Deliveries
3. View request/response

# Check Jenkins logs
docker logs jenkins | grep -i webhook

# Verify URL reachability
curl -X POST http://jenkins:8080/github-webhook/
```

### Issue: Build Hangs at Quality Gate

```bash
# Increase timeout (Jenkinsfile)
waitForQualityGate abortPipeline: true, timeout: 10

# Check SonarQube status
curl -s http://sonarqube:9000/api/ce/activity | jq .

# View SonarQube logs
docker logs sonarqube
```

### Issue: ECR Push Fails

```bash
# Verify credentials
aws sts get-caller-identity

# Check ECR repository
aws ecr describe-repositories --region ap-south-1

# Login to ECR manually
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com

# View ECR logs
aws logs tail /aws/ecr/fintechops --follow
```

### Issue: EKS Deployment Fails

```bash
# Check kubeconfig
kubectl config current-context

# View deployment status
kubectl describe deployment api-gateway -n production

# Check pod events
kubectl get events -n production --sort-by='.lastTimestamp'

# View pod logs
kubectl logs -n production deployment/api-gateway
```

## 🚀 Next Steps

1. Enable GitHub branch protection for main/staging
2. Configure Slack notifications
3. Set up monitoring dashboards (Grafana)
4. Implement backup/disaster recovery
5. Document runbooks for team

## 📚 References

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [SonarQube Integration](https://docs.sonarqube.org/latest/)
- [GitHub Actions vs Jenkins](https://docs.github.com/en/actions)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
