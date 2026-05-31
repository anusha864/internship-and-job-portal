# Jenkins CI/CD Pipeline Documentation

## Overview
This Jenkins pipeline automates the build, deployment, and testing of the Internship Portal application using Docker Compose.

## Pipeline Stages

### 1. 📋 Checkout Code
- Clones the repository from GitHub
- Verifies the latest 5 commits

### 2. 🔍 Validate Configuration
- Validates `docker-compose.yml` syntax
- Checks for required files (package.json, Jenkinsfile, etc.)

### 3. 🏗️ Build Docker Images
- Builds all Docker images defined in `docker-compose.yml`
- Includes:
  - Backend (Node.js + Express + SQLite)
  - Frontend (Nginx)
  - Prometheus (monitoring)
  - Grafana (dashboards)
  - Jenkins (CI/CD)

### 4. 🚀 Deploy Services
- Stops and removes old containers
- Starts all services with `docker compose up -d`
- Displays running services status

### 5. ⏳ Wait for Services
- Waits 15 seconds for services to initialize
- Polls backend endpoint up to 30 times to confirm readiness

### 6. ✅ Smoke Tests
Tests key endpoints:
- **Backend**: `http://localhost:5000/` (should return HTTP 200)
- **Frontend**: `http://localhost/` (should return HTTP 200 or 304)
- **Prometheus**: `http://localhost:9090/` (should return HTTP 200)
- **Grafana**: `http://localhost:3000/` (should return HTTP 200 or 302 redirect)

### 7. 📊 Health Check
- Displays container status
- Shows backend logs (last 20 lines)

### 8. 📈 Verify Monitoring Stack
- Verifies Prometheus is scraping targets
- Checks target health status

## Setup Instructions

### Prerequisites
- Jenkins installed and running
- Docker and Docker Compose installed
- Git installed
- Ports available: 5000 (backend), 80 (frontend), 9090 (Prometheus), 3000 (Grafana), 8080 (Jenkins)

### Jenkins Configuration

#### 1. Create a New Pipeline Job
1. Open Jenkins UI (`http://localhost:8080`)
2. Click **New Item**
3. Enter job name: `Internship-Portal-Pipeline`
4. Select **Pipeline**
5. Click **OK**

#### 2. Configure the Pipeline
In the job configuration:

**General Tab:**
- Enable "Build Triggers" → Tick **GitHub hook trigger for GITScm polling**

**Pipeline Tab:**
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/anusha864/internship-and-job-portal.git`
- Branch: `main`
- Script Path: `Jenkinsfile`

#### 3. Save and Run
Click **Save** and then **Build Now** to start the pipeline.

## Service Endpoints After Deployment

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:5000 | REST API for students, jobs, applications |
| Frontend | http://localhost | Web UI for internship portal |
| Prometheus | http://localhost:9090 | Metrics & monitoring |
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |
| Jenkins | http://localhost:8080 | CI/CD pipeline management |

## Environment Variables

Create a `.env` file in the backend directory:

```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket
PORT=5000
```

## Pipeline Failure Troubleshooting

### Backend not healthy
```bash
docker compose logs backend
curl http://localhost:5000/
```

### Frontend not responding
```bash
docker compose logs frontend
curl http://localhost/
```

### Prometheus not scraping
```bash
docker compose logs prometheus
curl http://localhost:9090/api/v1/targets
```

### Grafana connection issues
```bash
docker compose logs grafana
# Default credentials: admin/admin
# Add Prometheus datasource: http://prometheus:9090
```

## Manual Commands

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down

# Clean up volumes
docker compose down -v
```

## GitHub Webhook Integration

To trigger the pipeline automatically on code push:

1. Go to GitHub repository settings
2. Click **Webhooks** → **Add webhook**
3. Payload URL: `http://your-jenkins-server:8080/github-webhook/`
4. Content type: `application/json`
5. Events: Select **Just the push event**
6. Click **Add webhook**

## Performance Optimization

For faster builds:
- Add `.dockerignore` files to reduce build context
- Use Docker layer caching
- Run tests in parallel using `docker compose run`

## Security Considerations

- Store credentials in Jenkins Credentials Manager, not in code
- Use SSH keys instead of HTTPS tokens
- Scan Docker images for vulnerabilities
- Implement branch protection rules on GitHub

## Future Enhancements

- [ ] Add SonarQube code quality scanning
- [ ] Implement automated testing (Jest, Mocha)
- [ ] Add security scanning (Trivy, Snyk)
- [ ] Deploy to Kubernetes
- [ ] Add email/Slack notifications
- [ ] Implement blue-green deployments
