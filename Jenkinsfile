pipeline {
    agent any

    environment {
        GITHUB_REPO = 'https://github.com/anusha864/internship-and-job-portal.git'
        DOCKER_COMPOSE_CMD = 'docker compose'
        BRANCH = 'main'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage('Hello') {
            steps {
                echo 'Jenkins is working successfully ✓'
            }
        }

        stage('Checkout Code') {
            steps {
                echo '========== Cloning repository =========='
                git branch: "${BRANCH}", url: "${GITHUB_REPO}"
                sh 'git log --oneline -n 5'
            }
        }

        stage('Validate Configuration') {
            steps {
                echo '========== Validating docker-compose.yml =========='
                sh '${DOCKER_COMPOSE_CMD} config > /dev/null && echo "✓ docker-compose.yml is valid"'
                echo '========== Checking required files =========='
                sh '''
                    [ -f docker-compose.yml ] && echo "✓ docker-compose.yml exists"
                    [ -f backend/package.json ] && echo "✓ backend/package.json exists"
                    [ -f Jenkinsfile ] && echo "✓ Jenkinsfile exists"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                echo '========== Building Docker images =========='
                sh '${DOCKER_COMPOSE_CMD} build --no-cache'
                sh 'docker images | grep -E "(backend|frontend|prometheus|grafana)"'
            }
        }

        stage('Deploy Services') {
            steps {
                echo '========== Stopping old containers =========='
                sh '${DOCKER_COMPOSE_CMD} down -v || true'
                
                echo '========== Starting services =========='
                sh '${DOCKER_COMPOSE_CMD} up -d'
                
                echo '========== Service status =========='
                sh '${DOCKER_COMPOSE_CMD} ps'
            }
        }

        stage('Wait for Services') {
            steps {
                echo '========== Waiting for services to be ready =========='
                sh 'sleep 15'
                sh '''
                    echo "Checking if services are responding..."
                    for i in {1..30}; do
                        if curl -s http://localhost:5000/ > /dev/null 2>&1; then
                            echo "✓ Backend is ready"
                            break
                        fi
                        echo "Attempt $i/30: Waiting for backend..."
                        sleep 2
                    done
                '''
            }
        }

        stage('Smoke Tests') {
            steps {
                echo '========== Running smoke tests =========='
                sh '''
                    set +e
                    
                    echo "Testing Backend API..."
                    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)
                    if [ "$BACKEND_STATUS" = "200" ]; then
                        echo "✓ Backend is healthy (HTTP $BACKEND_STATUS)"
                    else
                        echo "⚠ Backend returned HTTP $BACKEND_STATUS"
                    fi

                    echo "Testing Frontend..."
                    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
                    if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "304" ]; then
                        echo "✓ Frontend is healthy (HTTP $FRONTEND_STATUS)"
                    else
                        echo "⚠ Frontend returned HTTP $FRONTEND_STATUS"
                    fi

                    echo "Testing Prometheus..."
                    PROM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/)
                    if [ "$PROM_STATUS" = "200" ]; then
                        echo "✓ Prometheus is healthy (HTTP $PROM_STATUS)"
                    else
                        echo "⚠ Prometheus returned HTTP $PROM_STATUS"
                    fi

                    echo "Testing Grafana..."
                    GRAFANA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
                    if [ "$GRAFANA_STATUS" = "200" ] || [ "$GRAFANA_STATUS" = "302" ]; then
                        echo "✓ Grafana is healthy (HTTP $GRAFANA_STATUS)"
                    else
                        echo "⚠ Grafana returned HTTP $GRAFANA_STATUS"
                    fi

                    set -e
                '''
            }
        }

        stage('📊 Health Check') {
            steps {
                echo '========== Container health status =========='
                sh '''
                    ${DOCKER_COMPOSE_CMD} ps
                    echo ""
                    echo "Container logs (last 20 lines):"
                    ${DOCKER_COMPOSE_CMD} logs --tail=20 backend
                '''
            }
        }

        stage('📈 Verify Monitoring Stack') {
            steps {
                echo '========== Checking Prometheus targets =========='
                sh '''
                    echo "Waiting for Prometheus to scrape targets..."
                    sleep 5
                    curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"' | head -10 || echo "Could not fetch targets"
                '''
            }
        }

    }

    post {
        always {
            echo '========== Pipeline Execution Complete =========='
            sh '${DOCKER_COMPOSE_CMD} ps'
        }
        
        success {
            echo '✅ Pipeline SUCCESS'
            echo 'Services running at:'
            echo '  - Backend: http://localhost:5000'
            echo '  - Frontend: http://localhost:80'
            echo '  - Prometheus: http://localhost:9090'
            echo '  - Grafana: http://localhost:3000'
            echo '  - Jenkins: http://localhost:8080'
        }
        
        failure {
            echo '❌ Pipeline FAILED'
            sh '${DOCKER_COMPOSE_CMD} logs --tail=50' || true
        }
        
        unstable {
            echo '⚠️ Pipeline UNSTABLE - Some services may not be running'
        }
    }
}