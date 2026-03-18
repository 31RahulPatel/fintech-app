#!/bin/bash

################################################################################
# FintechOps Complete CI/CD Setup Script
# Automates: GitHub, Jenkins, SonarQube, ECR, EKS configuration
# Usage: ./setup-cicd.sh --type=[local|aws|both]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SETUP_TYPE="${1:-local}"
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="196390795701"
JENKINS_PORT="8080"
SONARQUBE_PORT="9000"
APP_NAME="fintechops"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 not found. Please install $1 first."
        return 1
    fi
}

################################################################################
# Step 1: Check Prerequisites
################################################################################

setup_prerequisites() {
    log_info "Checking prerequisites..."
    
    local commands=("git" "docker" "kubectl" "aws")
    local missing=0
    
    for cmd in "${commands[@]}"; do
        if ! check_command "$cmd"; then
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -gt 0 ]; then
        log_error "Missing $missing required commands"
        return 1
    fi
    
    log_success "All prerequisites satisfied"
}

################################################################################
# Step 2: Setup AWS Resources
################################################################################

setup_aws_resources() {
    log_info "Setting up AWS resources..."
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        return 1
    fi
    log_success "AWS credentials verified"
    
    # Create ECR repository
    log_info "Creating ECR repository..."
    if ! aws ecr describe-repositories --repository-names "$APP_NAME" \
        --region "$AWS_REGION" 2>/dev/null; then
        
        aws ecr create-repository \
            --repository-name "$APP_NAME" \
            --region "$AWS_REGION"
        
        log_success "ECR repository created: $APP_NAME"
    else
        log_warn "ECR repository already exists: $APP_NAME"
    fi
    
    # Enable ECR scanning
    aws ecr put-image-scanning-configuration \
        --repository-name "$APP_NAME" \
        --image-scanning-configuration scanOnPush=true \
        --region "$AWS_REGION"
    
    log_success "ECR image scanning enabled"
    
    # Create IAM user for Jenkins (if not exists)
    if ! aws iam get-user --user-name jenkins-ci 2>/dev/null; then
        log_info "Creating IAM user: jenkins-ci..."
        aws iam create-user --user-name jenkins-ci
        
        # Create access keys
        aws iam create-access-key --user-name jenkins-ci > jenkins-iam-credentials.json
        
        # Attach policies
        aws iam attach-user-policy \
            --user-name jenkins-ci \
            --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
        
        aws iam attach-user-policy \
            --user-name jenkins-ci \
            --policy-arn arn:aws:iam::aws:policy/AmazonEKSFullAccess
        
        log_success "IAM user 'jenkins-ci' created"
        log_warn "Credentials saved to jenkins-iam-credentials.json - KEEP SECURE!"
    else
        log_warn "IAM user 'jenkins-ci' already exists"
    fi
}

################################################################################
# Step 3: Setup Local Docker Infrastructure
################################################################################

setup_local_docker() {
    log_info "Setting up local Docker infrastructure..."
    
    # Start Jenkins + SonarQube
    cd cicd
    
    log_info "Starting Docker containers..."
    docker-compose up -d
    
    log_info "Waiting for services to start (30 seconds)..."
    sleep 30
    
    # Get Jenkins initial password
    if docker ps | grep -q jenkins; then
        log_success "Jenkins container is running"
        
        JENKINS_PASSWORD=$(docker logs jenkins 2>&1 | grep "Please use the following password:" -A 1 | tail -1 | xargs)
        if [ -z "$JENKINS_PASSWORD" ]; then
            log_warn "Could not extract Jenkins password from logs"
            JENKINS_PASSWORD="Check: docker logs jenkins | grep password"
        fi
        
        echo -e "\n${GREEN}[JENKINS]${NC}"
        echo "URL: http://localhost:$JENKINS_PORT"
        echo "Initial Password: $JENKINS_PASSWORD"
        echo -e "⚠️  SAVE THIS PASSWORD - You'll need it for first login\n"
    fi
    
    # Check SonarQube
    if docker ps | grep -q sonarqube; then
        log_success "SonarQube container is running"
        
        echo -e "\n${GREEN}[SONARQUBE]${NC}"
        echo "URL: http://localhost:$SONARQUBE_PORT"
        echo "Default Login: admin/admin"
        echo -e "⚠️  CHANGE PASSWORD IMMEDIATELY\n"
    fi
    
    cd ..
}

################################################################################
# Step 4: Create GitHub Files
################################################################################

setup_github_files() {
    log_info "Creating GitHub configuration files..."
    
    # Create .github/workflows directory if not exists
    mkdir -p .github/workflows
    
    # Create GitHub Actions workflow for additional checks (optional)
    cat > .github/workflows/security-checks.yml << 'EOF'
name: Security Checks

on:
  pull_request:
    branches: [main, staging]

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          trivy-config: '.trivyignore'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
EOF
    
    log_success "Created .github/workflows/security-checks.yml"
    
    # Create CODEOWNERS file
    cat > .github/CODEOWNERS << 'EOF'
# Global owners
* @31RahulPatel

# Frontend
frontend/ @31RahulPatel

# Services
services/ @31RahulPatel

# CI/CD
cicd/ @31RahulPatel
Jenkinsfile @31RahulPatel

# Kubernetes
k8s/ @31RahulPatel
EOF
    
    log_success "Created .github/CODEOWNERS"
}

################################################################################
# Step 5: Create Jenkins Configuration Files
################################################################################

setup_jenkins_config() {
    log_info "Creating Jenkins configuration templates..."
    
    mkdir -p cicd/jenkins-config
    
    # Create Jenkins configuration as code (JCasC)
    cat > cicd/jenkins-config/jenkins.yaml << 'EOF'
jenkins:
  securityRealm:
    local:
      allowsSignup: false
  authorizationStrategy:
    roleBased:
      roles:
        global:
          - name: "admin"
            description: "Jenkins Administrator"
            permissions:
              - "*"
          - name: "developer"
            description: "Developer role"
            permissions:
              - "hudson.model.Item.Build"
              - "hudson.model.Item.Cancel"
              - "hudson.model.Item.Read"
              - "hudson.model.Run.Delete"
credentials:
  system:
    domainCredentials:
      - credentials:
          - github:
              id: "github-token"
              description: "GitHub Personal Access Token"
              scope: GLOBAL
          - aws:
              id: "aws-credentials"
              description: "AWS IAM Credentials"
              scope: GLOBAL
unclassified:
  location:
    url: "http://jenkins:8080/"
  gitHub:
    apiRateLimitChecker: ThrottleAtRate
EOF
    
    log_success "Created Jenkins configuration file"
}

################################################################################
# Step 6: Create Kubernetes Namespace and Resources
################################################################################

setup_kubernetes() {
    log_info "Setting up Kubernetes resources..."
    
    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        log_warn "Kubernetes cluster not configured. Skipping K8s setup..."
        return 0
    fi
    
    # Create namespaces
    for ns in production staging development; do
        if kubectl get namespace "$ns" 2>/dev/null; then
            log_warn "Namespace '$ns' already exists"
        else
            kubectl create namespace "$ns"
            log_success "Created namespace: $ns"
        fi
    done
    
    # Create image pull secrets
    for ns in production staging development; do
        kubectl create secret docker-registry ecr-credentials \
            --docker-server="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com" \
            --docker-username=AWS \
            --docker-password="$(aws ecr get-login-password --region $AWS_REGION)" \
            --docker-email=jenkins@fintechops.internal \
            -n "$ns" 2>/dev/null || log_warn "ECR secret already exists in $ns"
    done
    
    log_success "Kubernetes resources configured"
}

################################################################################
# Step 7: Create .trivyignore File
################################################################################

setup_trivy_config() {
    log_info "Creating Trivy configuration..."
    
    cat > .trivyignore << 'EOF'
# Trivy Ignore Config for FintechOps
# Format: CVE-YYYY-XXXX or package-name

# Add exceptions below with justification
# Example:
# CVE-2024-0001  # Low impact, fix in next release
EOF
    
    log_success "Created .trivyignore"
}

################################################################################
# Step 8: Create Setup Documentation
################################################################################

setup_documentation() {
    log_info "Creating setup documentation..."
    
    cat > SETUP_COMPLETE.md << 'EOF'
# FintechOps CI/CD Setup Complete ✅

## 🎉 What Was Set Up

- ✅ GitHub repository configuration
- ✅ Jenkins + SonarQube Docker infrastructure
- ✅ AWS ECR repository
- ✅ Kubernetes namespaces
- ✅ CI/CD pipeline (Jenkinsfile)
- ✅ Security scanning (Trivy)
- ✅ Code quality analysis (SonarQube)

## 🚀 Next Steps

### 1. Configure GitHub Webhook
```bash
# Jenkins → Manage Jenkins → Configure System → GitHub
# Add webhook to GitHub repository:
# Payload URL: http://<jenkins-host>:8080/github-webhook/
```

### 2. Add Jenkins Credentials
```bash
# Jenkins → Manage Credentials
# Add:
- github-token (Secret text)
- aws-credentials (AWS credentials)
- sonar-token (Secret text)
- docker-registry (Username/password)
```

### 3. Create Jenkins Pipeline Job
```bash
# Jenkins → New Item → Pipeline
- Name: FintechOps
- Pipeline: Pipeline script from SCM
- Repository: https://github.com/31RahulPatel/fintechapp.git
```

### 4. Enable GitHub Branch Protection
```bash
# GitHub → Settings → Branches → Add rule
# For 'main' branch:
- Require status checks to pass
- SonarQube Quality Gate
- Trivy Security Scan
```

### 5. Deploy Applications to AWS EKS
```bash
# Update kubeconfig
aws eks update-kubeconfig --name fintechops-eks --region ap-south-1

# Deploy via Kustomize
kubectl apply -k k8s/overlays/production/

# Verify
kubectl get deployments -n production
```

## 📊 Useful URLs

- **Jenkins**: http://localhost:8080
- **SonarQube**: http://localhost:9000 (admin/admin)
- **AWS ECR**: https://console.aws.amazon.com/ecr/repositories
- **GitHub**: https://github.com/31RahulPatel/fintechapp

## 🔒 Security Notes

- ⚠️ Change SonarQube default password immediately
- ⚠️ Rotate AWS credentials regularly
- ⚠️ Use GitHub Personal Access Tokens (not passwords)
- ⚠️ Enable branch protection on 'main' branch

## 📚 Documentation

- [GitHub Setup](docs/GITHUB_JENKINS_SETUP.md)
- [Jenkins Configuration](docs/GITHUB_JENKINS_SETUP.md)
- [SonarQube Setup](docs/SONARQUBE_SETUP.md)
- [Trivy Scanning](docs/TRIVY_SCANNING.md)
- [AWS EKS Deployment](docs/AWS_EKS_SETUP.md)

## 💡 Tips

1. Check Jenkins logs: `docker logs -f jenkins`
2. Check SonarQube logs: `docker logs -f sonarqube`
3. View build artifacts: Jenkins → Job → Artifacts
4. Monitor pipeline: `watch kubectl get pods -n production`

---

For more details, see the comprehensive setup guides in the `docs/` folder.
EOF
    
    log_success "Created SETUP_COMPLETE.md"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo -e "\n${BLUE}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║   FintechOps - Complete CI/CD Pipeline Setup Script       ║
║   GitHub → Jenkins → SonarQube → ECR → EKS                ║
╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    log_info "Starting CI/CD setup..."
    log_info "Setup Type: $SETUP_TYPE"
    
    # Step 1: Check prerequisites
    log_info "=== Step 1: Checking Prerequisites ==="
    setup_prerequisites || exit 1
    
    # Step 2: Setup AWS (if not local-only)
    if [ "$SETUP_TYPE" != "local" ]; then
        log_info "=== Step 2: Setting up AWS Resources ==="
        setup_aws_resources || exit 1
    fi
    
    # Step 3: Setup local Docker (if not aws-only)
    if [ "$SETUP_TYPE" != "aws" ]; then
        log_info "=== Step 3: Setting up Local Docker Infrastructure ==="
        setup_local_docker
    fi
    
    # Step 4: GitHub setup
    log_info "=== Step 4: Creating GitHub Configuration ==="
    setup_github_files
    
    # Step 5: Jenkins config
    log_info "=== Step 5: Creating Jenkins Configuration ==="
    setup_jenkins_config
    
    # Step 6: Kubernetes setup
    if [ "$SETUP_TYPE" != "local" ]; then
        log_info "=== Step 6: Setting up Kubernetes ==="
        setup_kubernetes
    fi
    
    # Step 7: Trivy config
    log_info "=== Step 7: Creating Trivy Configuration ==="
    setup_trivy_config
    
    # Step 8: Documentation
    log_info "=== Step 8: Creating Documentation ==="
    setup_documentation
    
    # Summary
    echo -e "\n${GREEN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                   SETUP COMPLETE! ✅                       ║
╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    log_success "All CI/CD components have been configured!"
    echo ""
    echo "📖 Next steps documented in: SETUP_COMPLETE.md"
    echo ""
}

main "$@"
