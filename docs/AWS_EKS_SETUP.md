# AWS EKS Deployment Setup Guide

## 📋 Overview

This guide covers the complete setup for deploying FintechOps microservices to AWS Elastic Kubernetes Service (EKS).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Internet → AWS Route 53 (DNS) → Application Load Balancer  │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
    ┌───▼───────────────────────────────┐   │
    │   EKS Cluster (ap-south-1)        │   │
    │   ┌─────────────────────────────┐ │   │
    │   │ Worker Node Group (Auto)    │ │   │
    │   │  ┌─────────────────────────┐│ │   │
    │   │  │ Microservice Pods       ││ │   │
    │   │  │  • Frontend             ││ │   │
    │   │  │  • API Gateway          ││ │   │
    │   │  │  • Auth Service         ││ │   │
    │   │  │  • Market Service       ││ │   │
    │   │  │  • ... others           ││ │   │
    │   │  └─────────────────────────┘│ │   │
    │   └─────────────────────────────┘ │   │
    └───────────────────────────────────┘   │
        ┌──────────────┬──────────────┐
        │              │              │
    ┌───▼────┐    ┌───▼────┐   ┌────▼─────┐
    │PostgreSQL│  │ MongoDB │   │   ECR    │
    │          │  │         │   │ (Images) │
    └──────────┘  └─────────┘   └──────────┘
```

## 🔧 Prerequisites

### Required Tools

```bash
# AWS CLI
aws --version  # >= 2.0

# kubectl
kubectl version --client  # >= 1.28

# eksctl
eksctl version  # >= 0.160

# helm
helm version  # >= 3.12

# docker (for ECR)
docker version
```

### AWS Credentials

```bash
# Configure AWS credentials
aws configure

# Verify access
aws sts get-caller-identity
```

### Required Permissions

IAM policy required:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:*",
        "ec2:*",
        "iam:*",
        "cloudformation:*",
        "logs:*",
        "ecr:*",
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## 📦 Step 1: Create EKS Cluster

### Using eksctl (Recommended)

```bash
# Create cluster
eksctl create cluster \
  --name=fintechops-eks \
  --region=ap-south-1 \
  --nodegroup-name=primary \
  --node-type=t3.medium \
  --nodes=3 \
  --nodes-min=2 \
  --nodes-max=5 \
  --with-oidc \
  --ssh-access \
  --managed

# Verify cluster creation
eksctl get cluster --name fintechops-eks --region ap-south-1

# Get kubeconfig (auto-configured)
kubectl cluster-info
```

### Manual Setup (via CloudFormation)

```bash
# Using VPC and EKS AWS CloudFormation templates
# See cicd/scripts/setup-eks.sh
```

## 🔗 Step 2: Configure kubectl Context

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --name fintechops-eks \
  --region ap-south-1

# Verify connection
kubectl get nodes
kubectl get pods --all-namespaces

# Expected output:
# NAME                           STATUS   ROLES    AGE     VERSION
# ip-10-0-xxx-xx.ec2.internal   Ready    <none>   5m00s   v1.29.1
```

## 🐳 Step 3: Configure ECR

### Create ECR Repository

```bash
# Create repository for FintechOps
aws ecr create-repository \
  --repository-name fintechops \
  --region ap-south-1

# Enable scan on push
aws ecr put-image-scanning-configuration \
  --repository-name fintechops \
  --image-scanning-configuration scanOnPush=true \
  --region ap-south-1

# Enable image tag mutability
aws ecr put-image-tag-mutability \
  --repository-name fintechops \
  --image-tag-mutability MUTABLE \
  --region ap-south-1
```

### Docker Login to ECR

```bash
# Login
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com

# Test push
docker tag myapp:latest \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:test
docker push \
  196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:test
```

## 📦 Step 4: Install Essential Add-ons

### AWS Load Balancer Controller

```bash
# Add Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install ALB Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=fintechops-eks \
  --set serviceAccount.create=true

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### EBS CSI Driver

```bash
# For persistent volumes
helm install aws-ebs-csi-driver eks/aws-ebs-csi-driver \
  -n kube-system \
  --set serviceAccount.controller.create=true

kubectl get daemonset -n kube-system ebs-csi-node
```

### Karpenter (Optional - Auto-scaling)

```bash
# Install Karpenter for intelligent node scaling
helm install karpenter oci://public.ecr.aws/karpenter/karpenter \
  --namespace karpenter --create-namespace \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::196390795701:role/KarpenterControllerRole
```

## 🔐 Step 5: Configure RBAC & Secrets

### Create Namespaces

```bash
# Create namespaces for environments
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace development

# Verify
kubectl get namespaces
```

### Create Docker Registry Secret

```bash
# Create secret for ECR authentication
kubectl create secret docker-registry ecr-credentials \
  --docker-server=196390795701.dkr.ecr.ap-south-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region ap-south-1) \
  --docker-email=jenkins@fintechops.internal \
  -n production

# Repeat for staging and development
```

### Create ConfigMaps & Secrets

```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=POSTGRES_USER=fintechops \
  --from-literal=POSTGRES_PASSWORD=secure_password \
  --from-literal=MONGODB_URI=mongodb://user:pass@host:27017/db \
  -n production

# Application configuration
kubectl create configmap app-config \
  --from-literal=ENVIRONMENT=production \
  --from-literal=LOG_LEVEL=info \
  -n production
```

## 📊 Step 6: Deploy Applications

### Deploy Using Kustomize

```bash
# Deploy to production
kubectl apply -k k8s/overlays/production/

# Verify deployments
kubectl get deployments -n production
kubectl get services -n production
kubectl get ingress -n production
```

### Deploy Using ArgoCD (GitOps)

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get ArgoCD password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at https://localhost:8080
```

### Register Git Repository with ArgoCD

```bash
# Add GitHub repository
argocd repo add https://github.com/31RahulPatel/fintechapp \
  --username <github-username> \
  --password <github-token> \
  --insecure-skip-server-verification

# Create ArgoCD application
kubectl apply -f k8s/argocd-apps.yaml
```

## 🔍 Step 7: Monitoring & Logging

### Deploy Prometheus & Grafana

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus Operator
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
# http://localhost:3000 (admin/prom-operator)
```

### Deploy Loki & Promtail

```bash
# Install Loki stack
helm install loki grafana/loki-stack \
  -n monitoring \
  -f monitoring/loki/values.yaml

# Verify
kubectl get pods -n monitoring
```

### Service Monitors for Prometheus

```bash
# Apply service monitors
kubectl apply -f k8s/base/service-monitors.yaml

# Verify
kubectl get servicemonitor -n production
```

## 🌐 Step 8: Configure Ingress & Load Balancer

### Create Ingress Resource

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fintechops-ingress
  namespace: production
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  ingressClassName: alb
  rules:
    - host: fintechops.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 3000
```

### Apply Ingress

```bash
kubectl apply -f k8s/base/ingress.yaml

# Get ALB DNS name
kubectl get ingress -n production

# Expected output:
# NAME                   CLASS   HOSTS         ADDRESS                               PORTS
# fintechops-ingress     alb     fintechops    k8s-production-xxxxx.us-east-1.elb    80, 443
```

### Configure DNS

```bash
# Update Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567ABCDEF \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "fintechops.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "k8s-production-xxxxx.us-east-1.elb.amazonaws.com"}]
      }
    }]
  }'
```

## 📈 Step 9: Auto-scaling Configuration

### Horizontal Pod Autoscaler

```yaml
# k8s/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Apply HPA

```bash
kubectl apply -f k8s/base/hpa.yaml

# Monitor scaling
kubectl get hpa -n production --watch
```

## 📝 Step 10: Verify Deployment

### Check Cluster Health

```bash
# Nodes
kubectl get nodes -o wide

# Pod status
kubectl get pods -n production

# Services
kubectl get svc -n production

# Endpoints
kubectl get endpoints -n production
```

### Test Application

```bash
# Port forward to test
kubectl port-forward -n production svc/frontend 3000:80

# Test API
curl http://localhost:3000/api/health
```

## 🔄 Ongoing Maintenance

### Update Applications

```bash
# Via ArgoCD (automatic)
# Push changes to Git repo, ArgoCD syncs automatically

# Manual update
kubectl set image deployment/api-gateway \
  api-gateway=196390795701.dkr.ecr.ap-south-1.amazonaws.com/fintechops:api-gateway-v2 \
  -n production

# Verify rollout
kubectl rollout status deployment/api-gateway -n production
```

### Scaling Nodes

```bash
# Autoscale node group
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name eks-primary-xxxxx \
  --desired-capacity 5

# Or update via eksctl
eksctl create nodegroup \
  --cluster=fintechops-eks \
  --name=secondary \
  --node-type=t3.large \
  --nodes=3
```

### Backup & Disaster Recovery

```bash
# Backup etcd
kubectl exec -it etcd-backup-pod -- \
  etcdctl snapshot save /backups/etcd-backup.db

# Backup to S3
aws s3 cp /backups/etcd-backup.db s3://fintechops-backups/etcd-backup.db
```

## 📚 Useful Commands

```bash
# Get detailed cluster info
kubectl describe cluster <cluster-name>

# Check resource usage
kubectl top nodes
kubectl top pods -n production

# View logs
kubectl logs -n production deployment/api-gateway
kubectl logs -n production pod/api-gateway-xxx

# Debug pod
kubectl exec -it pod/api-gateway-xxx -n production -- /bin/bash

# Get API server logs
kubectl logs -n kube-system pod/kube-apiserver-xxx

# Watch deployment changes
kubectl rollout history deployment/api-gateway -n production
kubectl rollout undo deployment/api-gateway -n production
```

## ❓ Troubleshooting

### Issue: Pod Stuck in Pending
```bash
kubectl describe pod <pod-name> -n production
kubectl get pvc -n production  # Check PVC
```

### Issue: Image Pull Errors
```bash
# Verify secret
kubectl get secret -n production
kubectl describe secret ecr-credentials -n production

# Recreate if needed
kubectl delete secret ecr-credentials -n production
# Run ECR secret creation step again
```

### Issue: LoadBalancer Stuck Provisioning
```bash
kubectl describe ingress fintechops-ingress -n production
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## 📚 Next Steps

1. Deploy monitoring stack (Prometheus, Grafana)
2. Set up log aggregation (Loki, Promtail)
3. Configure CI/CD pipeline for automated deployments
4. Set up alert rules and notifications
5. Implement disaster recovery procedures
