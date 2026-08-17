# Gambleshi — OpenShift Deployment Guide

Complete guide to deploy the Gambleshi casino games application on OpenShift with CI/CD, autoscaling, security, monitoring, and serverless functions.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial Cluster Setup](#2-initial-cluster-setup)
3. [Build & Push Container Image](#3-build--push-container-image)
4. [Deploy to OpenShift](#4-deploy-to-openshift)
5. [Configure CI/CD Pipeline](#5-configure-cicd-pipeline)
6. [Deploy Serverless Function](#6-deploy-serverless-function)
7. [Set Up Monitoring](#7-set-up-monitoring)
8. [Verify Everything](#8-verify-everything)
9. [Day-2 Operations](#9-day-2-operations)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Tools (install on your PC)

| Tool | Purpose | Install |
|------|---------|---------|
| `oc` CLI | Interact with OpenShift | [Download](https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/) |
| `git` | Version control | You already have this |

> **Note**: Docker is **NOT** required on your PC. All container builds happen in GitHub Actions.
> Node.js 22 LTS is used in all Dockerfiles and CI/CD. Node 20 is deprecated on GitHub Actions runners.

### Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **OpenShift cluster** | Target deployment platform | [Red Hat Developer Sandbox (free)](https://developers.redhat.com/developer-sandbox) |
| **Quay.io** | Container image registry | [quay.io](https://quay.io/) (free, sign up with Red Hat account) |
| **GitHub** | CI/CD pipeline | Your repo: `Madpsych0/gambleshi` |

### Step-by-Step: Install the `oc` CLI (Windows)

```powershell
# 1. Download the latest OpenShift client
#    Go to: https://mirror.openshift.com/pub/openshift-v4/clients/ocp/latest/
#    Download: openshift-client-windows-<version>.zip

# 2. Extract the zip file (contains oc.exe and kubectl.exe)

# 3. Move oc.exe to a folder that's in your PATH, for example:
mkdir -Force "$env:USERPROFILE\bin"
Move-Item oc.exe "$env:USERPROFILE\bin\oc.exe"

# 4. Add to PATH (if not already there) — run in PowerShell as Admin:
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\bin", "User")

# 5. Restart your terminal, then verify:
oc version
```

---

## 2. Initial Cluster Setup

### 2.1 Login to OpenShift

```bash
# Get your login token from the OpenShift web console:
# Click your username (top-right) → "Copy login command" → "Display Token"

oc login --token=YOUR_TOKEN --server=https://api.your-cluster.example.com:6443
```

### 2.2 Create the Project

```bash
# Create the gambleshi namespace
# (not needed on Sandbox � project already exists)

# Or if it already exists
oc project navaneethfr-dev
```

### 2.3 Create Secrets

```bash
# App secrets (replace with real values)
oc create secret generic gambleshi-secrets \
  --from-literal=app-secret-key='your-super-secret-key-here' \
  -n navaneethfr-dev

# Image pull secret (if using a private registry)
oc create secret docker-registry gambleshi-pull-secret \
  --docker-server=quay.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PASSWORD \
  -n navaneethfr-dev

# Link the pull secret to the service account
oc secrets link gambleshi-sa gambleshi-pull-secret --for=pull -n navaneethfr-dev
```

---

## 3. Build & Push Container Image

> **This step is only needed for the first manual deploy.** After CI/CD is configured, builds happen automatically.

### Option A: Build in OpenShift (no Docker needed)

```bash
# OpenShift can build from your Git repo directly
oc new-build --name=gambleshi \
  --binary=true \
  --strategy=docker \
  -n navaneethfr-dev

# Start a build from your local source
oc start-build gambleshi \
  --from-dir=. \
  --follow \
  -n navaneethfr-dev
```

### Option B: Build via GitHub Actions (recommended)

Push to `main` and the CI/CD pipeline handles everything. See [Section 5](#5-configure-cicd-pipeline).

---

## 4. Deploy to OpenShift

### 4.1 Apply Manifests (in order)

```bash
# Navigate to your project directory
# Apply manifests in dependency order

# 1. Namespace (skip if using oc new-project)
oc apply -f k8s/namespace.yaml

# 2. RBAC (ServiceAccount, Role, RoleBinding)
oc apply -f k8s/rbac.yaml

# 3. ConfigMap
oc apply -f k8s/configmap.yaml

# 4. Network Policies
oc apply -f k8s/networkpolicy.yaml

# 5. Deployment
# First, update the image placeholder with your actual image:
# On Windows PowerShell:
(Get-Content k8s/deployment.yaml) -replace 'IMAGE_PLACEHOLDER', 'quay.io/YOUR_USERNAME/gambleshi:latest' | Set-Content k8s/deployment.yaml
# On Linux/Mac:
# sed -i 's|IMAGE_PLACEHOLDER|quay.io/YOUR_USERNAME/gambleshi:latest|' k8s/deployment.yaml

oc apply -f k8s/deployment.yaml

# 6. Service (load balancer)
oc apply -f k8s/service.yaml

# 7. Route (external access with TLS)
oc apply -f k8s/route.yaml

# 8. HPA (autoscaling)
oc apply -f k8s/hpa.yaml

# 9. PDB (disruption budget)
oc apply -f k8s/pdb.yaml

# 10. PVC (optional — only if you need persistent storage)
# oc apply -f k8s/pvc.yaml
```

### 4.2 Verify Deployment

```bash
# Watch pods come up
oc get pods -n navaneethfr-dev -w

# Check deployment status
oc rollout status deployment/gambleshi -n navaneethfr-dev

# Get the app URL
oc get route gambleshi -n navaneethfr-dev -o jsonpath='{.spec.host}'

# Test the health endpoint
curl -k https://$(oc get route gambleshi -n navaneethfr-dev -o jsonpath='{.spec.host}')/healthz
```

### 4.3 Quick Apply Script

For convenience, apply everything at once:

```bash
# Apply all k8s manifests
oc apply -f k8s/namespace.yaml \
         -f k8s/rbac.yaml \
         -f k8s/configmap.yaml \
         -f k8s/networkpolicy.yaml \
         -f k8s/deployment.yaml \
         -f k8s/service.yaml \
         -f k8s/route.yaml \
         -f k8s/hpa.yaml \
         -f k8s/pdb.yaml
```

---

## 5. Configure CI/CD Pipeline

### 5.1 Create GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `REGISTRY_USERNAME` | Your Quay.io username | `madpsych0` |
| `REGISTRY_PASSWORD` | Your Quay.io password/token | `***` |
| `OPENSHIFT_SERVER` | OpenShift API server URL | `https://api.cluster.example.com:6443` |
| `OPENSHIFT_TOKEN` | OpenShift service account token | (see below) |

### 5.2 Get OpenShift Token for CI/CD

```bash
# Create a service account for CI/CD
oc create sa github-actions -n navaneethfr-dev

# Grant it edit permissions
oc adm policy add-role-to-user edit system:serviceaccount:gambleshi:github-actions -n navaneethfr-dev

# Get the token
oc create token github-actions -n navaneethfr-dev --duration=8760h
```

Copy the output token and save it as the `OPENSHIFT_TOKEN` GitHub secret.

### 5.3 Create GitHub Environment

Go to your GitHub repo → **Settings** → **Environments** → **New environment**:
- Name: `production`
- Add protection rules as needed (manual approval, etc.)

### 5.4 Test the Pipeline

```bash
# Push to main to trigger the pipeline
git add .
git commit -m "feat: add OpenShift deployment infrastructure"
git push origin main
```

Monitor the pipeline at: `https://github.com/Madpsych0/gambleshi/actions`

---

## 6. Deploy Serverless Function

### 6.1 Prerequisites

```bash
# Check if OpenShift Serverless operator is installed
oc get csv -n openshift-serverless

# If not installed, install via OperatorHub:
# OpenShift Console → Operators → OperatorHub → Search "OpenShift Serverless" → Install

# Verify Knative Serving is ready
oc get knativeserving knative-serving -n knative-serving

# Verify Knative Eventing is ready
oc get knativeeventing knative-eventing -n knative-eventing
```

### 6.2 Build the Function Image

```bash
# Build in OpenShift
oc new-build --name=game-event-handler \
  --binary=true \
  --strategy=docker \
  --context-dir=serverless/game-event-handler \
  -n navaneethfr-dev

oc start-build game-event-handler \
  --from-dir=serverless/game-event-handler \
  --follow \
  -n navaneethfr-dev
```

### 6.3 Deploy Knative Service

```bash
# Update the image in knative-service.yaml with your built image
# Then apply:
oc apply -f serverless/knative-service.yaml

# Create the event broker
oc apply -f - <<EOF
apiVersion: eventing.knative.dev/v1
kind: Broker
metadata:
  name: default
  namespace: navaneethfr-dev
EOF

# Apply event triggers
oc apply -f serverless/knative-trigger.yaml
```

### 6.4 Test the Function

```bash
# Get the Knative service URL
oc get ksvc game-event-handler -n navaneethfr-dev

# Send a test CloudEvent
curl -X POST \
  $(oc get ksvc game-event-handler -n navaneethfr-dev -o jsonpath='{.status.url}') \
  -H "Content-Type: application/json" \
  -H "Ce-Id: test-001" \
  -H "Ce-Specversion: 1.0" \
  -H "Ce-Type: game.bet.placed" \
  -H "Ce-Source: test" \
  -d '{
    "userId": "user123",
    "gameType": "crash",
    "amount": 10.50,
    "currency": "USD"
  }'
```

---

## 7. Set Up Monitoring

### 7.1 Enable User Workload Monitoring

```bash
# Enable user workload monitoring (requires cluster-admin or cluster-monitoring-edit)
oc apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-monitoring-config
  namespace: openshift-monitoring
data:
  config.yaml: |
    enableUserWorkload: true
EOF

# Wait for the user workload monitoring pods to come up
oc get pods -n openshift-user-workload-monitoring -w
```

### 7.2 Apply Monitoring Resources

```bash
# ServiceMonitor (Prometheus scrape config)
oc apply -f k8s/monitoring/servicemonitor.yaml

# Alert rules
oc apply -f k8s/monitoring/prometheus-rules.yaml

# Grafana dashboard
oc apply -f k8s/monitoring/grafana-dashboard.yaml
```

### 7.3 Access Monitoring

```bash
# Prometheus UI (OpenShift built-in)
# OpenShift Console → Observe → Metrics
# Try query: container_cpu_usage_seconds_total{namespace="gambleshi"}

# Alerts
# OpenShift Console → Observe → Alerting

# Grafana (if installed via operator)
oc get route grafana -n openshift-monitoring
```

---

## 8. Verify Everything

Run this checklist after deployment:

```bash
echo "=== 1. Pods Running ==="
oc get pods -n navaneethfr-dev

echo ""
echo "=== 2. Deployment Status ==="
oc rollout status deployment/gambleshi -n navaneethfr-dev

echo ""
echo "=== 3. Service ==="
oc get svc gambleshi -n navaneethfr-dev

echo ""
echo "=== 4. Route (TLS) ==="
oc get route gambleshi -n navaneethfr-dev

echo ""
echo "=== 5. HPA ==="
oc get hpa gambleshi -n navaneethfr-dev

echo ""
echo "=== 6. PDB ==="
oc get pdb gambleshi -n navaneethfr-dev

echo ""
echo "=== 7. Network Policies ==="
oc get networkpolicy -n navaneethfr-dev

echo ""
echo "=== 8. RBAC ==="
oc get sa,role,rolebinding -n navaneethfr-dev

echo ""
echo "=== 9. Serverless ==="
oc get ksvc -n navaneethfr-dev 2>/dev/null || echo "Knative not configured"

echo ""
echo "=== 10. Monitoring ==="
oc get servicemonitor,prometheusrule -n navaneethfr-dev

echo ""
echo "=== 11. Health Check ==="
ROUTE=$(oc get route gambleshi -n navaneethfr-dev -o jsonpath='{.spec.host}')
echo "App URL: https://${ROUTE}"
curl -sk "https://${ROUTE}/healthz"
```

---

## 9. Day-2 Operations

### Rolling Update (Zero Downtime)

```bash
# Trigger a new deployment (e.g., after pushing new image)
oc set image deployment/gambleshi \
  gambleshi=quay.io/YOUR_USERNAME/gambleshi:NEW_TAG \
  -n navaneethfr-dev

# Watch the rolling update
oc rollout status deployment/gambleshi -n navaneethfr-dev

# Rollback if something goes wrong
oc rollout undo deployment/gambleshi -n navaneethfr-dev
```

### Scaling

```bash
# Manual scale (HPA will override within its range)
oc scale deployment/gambleshi --replicas=5 -n navaneethfr-dev

# Check HPA status
oc get hpa gambleshi -n navaneethfr-dev
oc describe hpa gambleshi -n navaneethfr-dev
```

### Viewing Logs

```bash
# Logs from all pods
oc logs -l app.kubernetes.io/name=gambleshi -n navaneethfr-dev --tail=100

# Logs from a specific pod
oc logs gambleshi-xxxxx -n navaneethfr-dev

# Follow logs in real-time
oc logs -f deployment/gambleshi -n navaneethfr-dev
```

### Update ConfigMap

```bash
# Edit the ConfigMap
oc edit configmap gambleshi-config -n navaneethfr-dev

# Restart pods to pick up changes (rolling restart)
oc rollout restart deployment/gambleshi -n navaneethfr-dev
```

---

## 10. Troubleshooting

### Pod Won't Start

```bash
# Check pod events
oc describe pod <pod-name> -n navaneethfr-dev

# Common issues:
# - ImagePullBackOff → check pull secret and image name
# - CrashLoopBackOff → check logs: oc logs <pod> -n navaneethfr-dev
# - Pending → check resources: oc describe node
```

### Route Not Accessible

```bash
# Verify route exists and has a host
oc get route gambleshi -n navaneethfr-dev -o yaml

# Check if TLS is configured
oc get route gambleshi -n navaneethfr-dev -o jsonpath='{.spec.tls}'

# Check NetworkPolicy isn't blocking
oc get networkpolicy -n navaneethfr-dev
```

### HPA Not Scaling

```bash
# Check HPA status
oc describe hpa gambleshi -n navaneethfr-dev

# Verify metrics server is running
oc get pods -n openshift-monitoring | grep metrics

# Check if resource requests are set (HPA requires them)
oc get deployment gambleshi -n navaneethfr-dev -o jsonpath='{.spec.template.spec.containers[0].resources}'
```

### Monitoring Not Working

```bash
# Check if ServiceMonitor is picked up
oc get servicemonitor -n navaneethfr-dev

# Check Prometheus targets
# OpenShift Console → Observe → Targets → Filter by namespace "navaneethfr-dev"

# Verify user workload monitoring is enabled
oc get pods -n openshift-user-workload-monitoring
```

---

## Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │              OpenShift Cluster               │
                    │                                             │
  Users ──HTTPS──▶ │  ┌─────────┐    ┌──────────────────────┐   │
                    │  │  Route   │───▶│    Service (LB)      │   │
                    │  │  (TLS)   │    │   ClusterIP :80      │   │
                    │  └─────────┘    └──────┬───────────────┘   │
                    │                         │                   │
                    │              ┌──────────┼──────────┐       │
                    │              ▼          ▼          ▼       │
                    │         ┌────────┐ ┌────────┐ ┌────────┐  │
                    │         │ Pod 1  │ │ Pod 2  │ │ Pod 3  │  │
                    │         │ Nginx  │ │ Nginx  │ │ Nginx  │  │
                    │         │ :8080  │ │ :8080  │ │ :8080  │  │
                    │         └────────┘ └────────┘ └────────┘  │
                    │              ▲          ▲          ▲       │
                    │              └──────────┼──────────┘       │
                    │                    HPA (3-10)              │
                    │                                             │
                    │  ┌──────────────┐   ┌───────────────────┐  │
                    │  │   Knative    │   │   Prometheus +    │  │
                    │  │  Serverless  │   │   Grafana         │  │
                    │  │  (0-5 pods)  │   │   Monitoring      │  │
                    │  └──────────────┘   └───────────────────┘  │
                    └─────────────────────────────────────────────┘
```
