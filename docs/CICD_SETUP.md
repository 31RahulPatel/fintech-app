# FintechOps CI/CD Deployment Guide

## Complete Pipeline: GitHub → Jenkins → SonarQube → Docker → Trivy → ECR → ArgoCD → EKS

```
┌──────────┐    Webhook    ┌──────────────────────────────────────────────────────┐
│  GitHub   │─────────────→│  Jenkins (EC2 - Docker)                              │
│  (Push)   │              │  ┌──────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐   │
└──────────┘              │  │ SonarQube│→│Docker    │→│ Trivy │→│ECR Push  │   │
                           │  │ Scan     │ │Build     │ │ Scan  │ │          │   │
                           │  └──────────┘ └──────────┘ └───────┘ └────┬─────┘   │
                           │                                           │          │
                           │  ┌──────────────────────────────┐         │          │
                           │  │ Update k8s manifests (Git)   │←────────┘          │
                           │  └──────────┬───────────────────┘                    │
                           └──────────────┼───────────────────────────────────────┘
                                          │ Git Push
                                          ▼
                           ┌──────────────────────────────┐
                           │  ArgoCD (Auto-Sync)           │
                           │  Watches Git → Deploys to EKS │
                           └──────────┬───────────────────┘
                                      ▼
                           ┌──────────────────────────────┐
                           │  EKS Cluster                  │
                           │  ┌────────────────────────┐   │
                           │  │ AWS ALB (Single)       │   │
                           │  │  ├─ app.domain.com     │   │
                           │  │  ├─ api.domain.com     │   │
                           │  │  ├─ argocd.domain.com  │   │
                           │  │  ├─ grafana.domain.com │   │
                           │  │  └─ prometheus.domain   │   │
                           │  └────────────────────────┘   │
                           └──────────────────────────────┘
```

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [PHASE 1: EC2 Setup (Jenkins + SonarQube)](#2-phase-1-ec2-setup)
3. [PHASE 2: EKS Cluster Setup](#3-phase-2-eks-cluster-setup)
4. [PHASE 3: AWS ALB Controller](#4-phase-3-aws-alb-controller)
5. [PHASE 4: ArgoCD Setup](#5-phase-4-argocd-setup)
6. [PHASE 5: Monitoring (Prometheus + Grafana)](#6-phase-5-monitoring)
7. [PHASE 6: Jenkins Pipeline Configuration](#7-phase-6-jenkins-pipeline-configuration)
8. [PHASE 7: GitHub Webhook](#8-phase-7-github-webhook)
9. [PHASE 8: DNS & SSL Setup](#9-phase-8-dns--ssl-setup)
10. [PHASE 9: Deploy Application](#10-phase-9-deploy-application)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

### AWS Account Requirements
- AWS CLI v2 installed and configured (`aws configure`)
- IAM User with these permissions:
  - `AdministratorAccess` (or specific: EKS, ECR, EC2, IAM, ACM, Route53, ELB)
- `eksctl` installed: `brew install eksctl` (macOS) or [eksctl docs](https://eksctl.io/installation/)
- `kubectl` installed: `brew install kubectl`
- `helm` installed: `brew install helm`
- A domain name (for ALB routing)

### What You'll Create
| Resource | Purpose | Estimated Cost |
|----------|---------|---------------|
| EC2 t3.large | Jenkins + SonarQube | ~$60/mo |
| EKS Cluster | Kubernetes control plane | ~$72/mo |
| 3x t3.large Nodes | Worker nodes | ~$180/mo |
| ALB | Load Balancer | ~$20/mo |
| ECR | Docker image storage | ~$5/mo |
| EBS Volumes | Database storage | ~$10/mo |
| ACM Certificate | SSL/TLS (free) | Free |
| **Total** | | **~$347/mo** |

---

## 2. PHASE 1: EC2 Setup (Jenkins + SonarQube)

### Step 1: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Configure:
   - **Name**: `FintechOps-CICD`
   - **AMI**: Ubuntu 22.04 LTS (64-bit x86)
   - **Instance type**: `t3.large` (2 vCPU, 8 GB RAM) - minimum for Jenkins + SonarQube
   - **Key pair**: Create or select existing
   - **Network**: Default VPC
   - **Security Group**: Create new with these rules:

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | Your IP | SSH access |
| Custom TCP | 8080 | 0.0.0.0/0 | Jenkins UI |
| Custom TCP | 9000 | 0.0.0.0/0 | SonarQube UI |
| Custom TCP | 50000 | 0.0.0.0/0 | Jenkins agents |

   - **Storage**: 50 GB gp3
3. Click **Launch Instance**

### Step 2: SSH into EC2 & Install Docker

```bash
# SSH into your EC2
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Verify Docker
docker --version
docker compose version

# Increase vm.max_map_count for SonarQube (Elasticsearch)
echo "vm.max_map_count=524288" | sudo tee -a /etc/sysctl.conf
echo "fs.file-max=131072" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Step 3: Clone Repo & Start Jenkins + SonarQube

```bash
# Clone your repo
git clone <YOUR_GITHUB_REPO_URL> fintechops
cd fintechops/cicd

# Start Jenkins + SonarQube
docker compose up -d

# Wait for containers to start (~2-3 minutes)
docker compose logs -f  # Ctrl+C to exit when ready
```

### Step 4: Configure SonarQube

1. Open: `http://<EC2_PUBLIC_IP>:9000`
2. Login: `admin` / `admin` → Change password when prompted
3. Go to **Administration → Security → Users → admin → Tokens**
4. Generate token: Name = `jenkins`, Type = `Global Analysis Token`
5. **COPY THE TOKEN** — you'll need it for Jenkins
6. Go to **Projects → Create Project → Manually**:
   - Project key: `fintechops`
   - Display name: `FintechOps`

### Step 5: Configure Jenkins

1. Open: `http://<EC2_PUBLIC_IP>:8080`
2. Get initial admin password:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```
3. Complete the setup wizard → Install suggested plugins
4. Create admin user

5. **Install additional plugins** (Manage Jenkins → Plugins → Available):
   - `SonarQube Scanner`
   - `Docker Pipeline`
   - `Pipeline: AWS Steps`
   - `Amazon ECR`
   - `Generic Webhook Trigger`

6. **Configure credentials** (Manage Jenkins → Credentials → System → Global):

| ID | Type | Value |
|----|------|-------|
| `aws-credentials` | AWS Credentials | Your AWS Access Key + Secret Key |
| `sonar-token` | Secret text | SonarQube token from Step 4 |
| `github-token` | Username/Password | GitHub username + Personal Access Token |

7. **Configure SonarQube** (Manage Jenkins → System → SonarQube servers):
   - Name: `SonarQube`
   - Server URL: `http://sonarqube:9000` (Docker network name)
   - Server authentication token: Select `sonar-token` credential

8. **Configure SonarQube Scanner** (Manage Jenkins → Tools → SonarQube Scanner):
   - Name: `SonarScanner`
   - Install automatically or use `/opt/sonar-scanner` (pre-installed in our Docker image)

---

## 3. PHASE 2: EKS Cluster Setup

### Option A: Using the script (recommended)

```bash
# From your local machine (not EC2)
cd cicd/scripts
chmod +x *.sh

# Create EKS cluster (~15-20 minutes)
./setup-eks.sh fintechops-cluster us-east-1
```

### Option B: Using eksctl directly

```bash
eksctl create cluster \
  --name fintechops-cluster \
  --region us-east-1 \
  --version 1.29 \
  --nodegroup-name fintechops-nodes \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 6 \
  --managed \
  --with-oidc

# Install EBS CSI Driver for persistent storage
eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster fintechops-cluster \
  --region us-east-1 \
  --force
```

### Option C: Using AWS Console

1. **AWS Console → EKS → Create Cluster**
   - Name: `fintechops-cluster`
   - Kubernetes version: `1.29`
   - Cluster service role: Create new (AmazonEKSClusterPolicy)
   - VPC: Default
   - Subnets: Select all AZs
   - Security group: Default
   - Cluster endpoint access: Public and private

2. **Add Node Group** (after cluster is Active):
   - Name: `fintechops-nodes`
   - Instance type: `t3.large`
   - Desired: 3, Min: 2, Max: 6
   - Disk size: 30 GB

3. **Update kubeconfig**:
   ```bash
   aws eks update-kubeconfig --name fintechops-cluster --region us-east-1
   kubectl get nodes  # Verify nodes are Ready
   ```

### Create ECR Repository

One single ECR repo stores all service images, differentiated by tag prefix:

```bash
cd cicd/scripts
chmod +x create-ecr-repos.sh
./create-ecr-repos.sh us-east-1
```

Tag convention: `fintechops:frontend-5-a1b2c3d`, `fintechops:api-gateway-5-a1b2c3d`, etc.

---

## 4. PHASE 3: AWS ALB Controller

The ALB Controller creates a single AWS Application Load Balancer shared across all services.

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
./install-alb-controller.sh fintechops-cluster us-east-1 $AWS_ACCOUNT_ID
```

Verify:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

---

## 5. PHASE 4: ArgoCD Setup (Runs as Pod inside EKS)

ArgoCD is installed directly into your EKS cluster as pods in the `argocd` namespace.
It is accessed externally via the **same shared ALB** as your application.

```bash
./install-argocd.sh yourdomain.com
```

After installation:
```bash
# Get ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Apply ArgoCD Application manifests
kubectl apply -f ../../k8s/argocd-apps.yaml
```

**IMPORTANT**: Update the ArgoCD ingress with your ACM certificate ARN:
```bash
kubectl edit ingress argocd-ingress -n argocd
# Replace REPLACE_WITH_ACM_CERT_ARN with your actual ARN
```

---

## 6. PHASE 5: Monitoring (Runs as Pods inside EKS)

Prometheus and Grafana are installed into your EKS cluster as pods in the `monitoring` namespace
using the `kube-prometheus-stack` Helm chart. Both are accessed via the **same shared ALB**.

```bash
./install-monitoring.sh yourdomain.com arn:aws:acm:us-east-1:<ACCOUNT_ID>:certificate/<CERT_ID>
```

Verify pods are running inside EKS:
```bash
kubectl get pods -n monitoring
kubectl get pods -n argocd
kubectl get ingress -n monitoring
kubectl get ingress -n argocd
```

All share the same ALB via `alb.ingress.kubernetes.io/group.name: fintechops-shared`.

---

## 7. PHASE 6: Jenkins Pipeline Configuration

### Create Pipeline Job

1. **Jenkins → New Item → Pipeline**
   - Name: `fintechops-pipeline`
   - Select: **Pipeline**

2. **Configure**:
   - **Build Triggers**: Check `GitHub hook trigger for GITScm polling`
   - **Pipeline**: 
     - Definition: `Pipeline script from SCM`
     - SCM: `Git`
     - Repository URL: `<YOUR_GITHUB_REPO_URL>`
     - Credentials: Select `github-token`
     - Branch: `*/main` (and `*/develop`)
     - Script Path: `Jenkinsfile`

3. **Save**

### Update Jenkinsfile Placeholders

Open `Jenkinsfile` and update these values:
```groovy
AWS_ACCOUNT_ID = '123456789012'           // Your AWS Account ID
GITHUB_REPO    = 'https://github.com/user/fintechops.git'
DOMAIN         = 'yourdomain.com'
```

---

## 8. PHASE 7: GitHub Webhook

1. Go to your GitHub repo → **Settings → Webhooks → Add webhook**
2. Configure:
   - **Payload URL**: `http://<EC2_PUBLIC_IP>:8080/github-webhook/`
   - **Content type**: `application/json`
   - **SSL verification**: Disable (unless you set up HTTPS for Jenkins)
   - **Events**: Select `Just the push event`
3. Click **Add webhook**

Test: Make a commit → Push → Jenkins job should trigger automatically.

---

## 9. PHASE 8: DNS & SSL Setup

### Request ACM Certificate

1. **AWS Console → Certificate Manager → Request Certificate**
   - Domain names (add all):
     ```
     yourdomain.com
     *.yourdomain.com
     ```
   - Validation: DNS validation
2. Click the certificate → **Create records in Route 53** (if using Route 53)
3. Wait for validation (~5 minutes)
4. **Copy the Certificate ARN**

### Configure Route 53 DNS

After ALB is created (it auto-creates when Ingress is applied), get the ALB DNS name:

```bash
kubectl get ingress -A
# Look for the ADDRESS column - this is the ALB DNS name
```

1. **AWS Console → Route 53 → Hosted Zone → Your Domain**
2. Create these CNAME records:

| Record Name | Type | Value |
|-------------|------|-------|
| `yourdomain.com` | A (Alias) | ALB DNS name |
| `api.yourdomain.com` | CNAME | ALB DNS name |
| `argocd.yourdomain.com` | CNAME | ALB DNS name |
| `grafana.yourdomain.com` | CNAME | ALB DNS name |
| `prometheus.yourdomain.com` | CNAME | ALB DNS name |

### Update ACM Certificate ARN in Manifests

```bash
# Replace in k8s/base/ingress.yaml
sed -i 's|<ACM_CERT_ARN>|arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID|g' k8s/base/ingress.yaml

# Replace domain
sed -i 's|<YOUR_DOMAIN>|yourdomain.com|g' k8s/base/ingress.yaml
sed -i 's|<YOUR_DOMAIN>|yourdomain.com|g' k8s/base/configmap.yaml

# Commit and push
git add -A
git commit -m "Configure production domain and SSL"
git push
```

---

## 10. PHASE 9: Deploy Application

### Update Secrets with Real Values

```bash
# Edit the secrets file with your actual values
# NEVER commit real secrets to Git - use sealed-secrets or external-secrets in production
vim k8s/base/secrets.yaml
```

Key secrets to update:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate random strings
- `MONGODB_ROOT_PASSWORD` / `POSTGRES_PASSWORD` — strong passwords
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `AWS_COGNITO_USER_POOL_ID` / `AWS_COGNITO_CLIENT_ID` / `AWS_COGNITO_CLIENT_SECRET`
- `GROQ_API_KEY`
- `MARKET_API_KEY` / `NEWS_API_KEY`
- `AWS_SES_FROM_EMAIL`

### Manual First Deploy (if not using ArgoCD auto-sync yet)

```bash
# Apply base resources
kubectl apply -k k8s/overlays/production/

# Verify pods
kubectl get pods -n fintechops-production -w

# Check ALB was created
kubectl get ingress -n fintechops-production
```

### Or Push to GitHub and Let the Pipeline Handle it

```bash
git add -A
git commit -m "Initial deployment configuration"
git push origin main
```

This triggers: Jenkins CI → ECR → ArgoCD → EKS. 

### Verify Everything

```bash
# Check all pods are running
kubectl get pods -n fintechops-production

# Check services
kubectl get svc -n fintechops-production

# Check ingress (ALB)
kubectl get ingress -A

# Check ArgoCD sync status
kubectl get applications -n argocd

# Check monitoring
kubectl get pods -n monitoring

# Test endpoints
curl https://yourdomain.com          # Frontend
curl https://api.yourdomain.com/health  # API Gateway 
```

---

## 11. Troubleshooting

### ALB Not Creating
```bash
# Check ALB Controller logs
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# Verify ingress annotations
kubectl describe ingress -n fintechops-production
```

### Pods in CrashLoopBackOff
```bash
# Check pod logs
kubectl logs <pod-name> -n fintechops-production

# Check events
kubectl describe pod <pod-name> -n fintechops-production
```

### ArgoCD Sync Failed
```bash
# Check ArgoCD app status
kubectl get applications -n argocd
kubectl describe application fintechops-production -n argocd

# Check ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```

### Jenkins Build Failing
```bash
# SSH into EC2 and check Jenkins logs
docker logs jenkins

# Check if Docker socket is accessible
docker exec jenkins docker ps
```

### ECR Push Permission Denied
```bash
# Verify AWS credentials in Jenkins
# Re-login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

### PVC Pending (Databases)
```bash
# Check if EBS CSI Driver is installed
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver

# Check StorageClass
kubectl get storageclass

# Check PVC status
kubectl describe pvc -n fintechops-production
```

---

## File Structure Reference

```
fintech/
├── Jenkinsfile                    # CI Pipeline definition
├── sonar-project.properties       # SonarQube config
├── cicd/
│   ├── docker-compose.yml         # Jenkins + SonarQube (for EC2)
│   ├── jenkins/
│   │   ├── Dockerfile             # Custom Jenkins with tools
│   │   └── plugins.txt            # Jenkins plugins
│   └── scripts/
│       ├── create-ecr-repos.sh    # Create single ECR repository
│       ├── setup-eks.sh           # Create EKS cluster
│       ├── install-alb-controller.sh
│       ├── install-argocd.sh
│       └── install-monitoring.sh
├── k8s/
│   ├── argocd-apps.yaml           # ArgoCD Application definitions
│   ├── base/
│   │   ├── kustomization.yaml     # Base Kustomize config
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml
│   │   ├── ingress.yaml           # AWS ALB Ingress (shared)
│   │   ├── hpa.yaml               # Horizontal Pod Autoscaler
│   │   ├── storage-class.yaml     # GP3 StorageClass
│   │   └── deployments/
│   │       ├── frontend.yaml
│   │       ├── api-gateway.yaml
│   │       ├── auth-service.yaml
│   │       ├── user-service.yaml
│   │       ├── calculator-service.yaml
│   │       ├── market-service.yaml
│   │       ├── news-service.yaml
│   │       ├── blog-service.yaml
│   │       ├── chatbot-service.yaml
│   │       ├── email-service.yaml
│   │       ├── admin-service.yaml
│   │       ├── mongodb.yaml       # MongoDB StatefulSet
│   │       ├── postgres.yaml      # PostgreSQL StatefulSet
│   │       └── redis.yaml         # Redis StatefulSet
│   └── overlays/
│       ├── staging/
│       │   └── kustomization.yaml # Staging overrides
│       └── production/
│           └── kustomization.yaml # Production overrides
└── monitoring/
    └── ...                        # Monitoring configs (used by Helm)
```

---

## Quick Reference: Placeholders to Replace

Search and replace these across all files:

| Placeholder | Replace With | Example |
|-------------|-------------|---------|
| `<YOUR_AWS_ACCOUNT_ID>` | AWS Account ID | `123456789012` |
| `<AWS_ACCOUNT_ID>` | AWS Account ID (in kustomization) | `123456789012` |
| `<YOUR_GITHUB_REPO_URL>` | GitHub repo URL | `https://github.com/user/fintechops.git` |
| `<YOUR_DOMAIN>` | Your domain | `fintechops.com` |
| `<ACM_CERT_ARN>` | ACM Certificate ARN | `arn:aws:acm:us-east-1:123456789012:certificate/abc-123` |
| `<EC2_PUBLIC_IP>` | EC2 instance IP | `54.123.45.67` |

> **ECR**: All images go into **one** repository (`fintechops`). Each service is
> identified by its tag prefix: `frontend-5-a1b2c3d`, `api-gateway-5-a1b2c3d`, etc.
>
> **ArgoCD / Prometheus / Grafana**: Run as pods inside EKS and are accessed
> through the same shared ALB using host-based routing.

```bash
# Quick find and replace all
find . -type f \( -name "*.yaml" -o -name "*.yml" -o -name "Jenkinsfile" \) \
  -exec sed -i '' \
    -e 's|<YOUR_AWS_ACCOUNT_ID>|123456789012|g' \
    -e 's|<YOUR_GITHUB_REPO_URL>|https://github.com/user/fintechops.git|g' \
    -e 's|<YOUR_DOMAIN>|yourdomain.com|g' \
    -e 's|<ACM_CERT_ARN>|arn:aws:acm:us-east-1:123456789012:certificate/abc|g' \
    {} +
```
