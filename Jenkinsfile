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
    }

    stages {
        stage('Clone Code') {
            steps {
                echo '========== Cloning repository =========='
                git branch: "${BRANCH}", url: "${GITHUB_REPO}"
            }
        }

        stage('Build Docker Images') {
            steps {
                echo '========== Building Docker images =========='
                sh '${DOCKER_COMPOSE_CMD} -f docker-compose.yml -f monitoring/docker-compose-monitoring.yml build'
            }
        }

        stage('Run Containers') {
            steps {
                echo '========== Starting containers =========='
                sh '${DOCKER_COMPOSE_CMD} -f docker-compose.yml -f monitoring/docker-compose-monitoring.yml down || true'
                sh '${DOCKER_COMPOSE_CMD} -f docker-compose.yml -f monitoring/docker-compose-monitoring.yml up -d'
            }
        }

        stage('Check Running Containers') {
            steps {
                echo '========== Checking container status =========='
                sh 'docker ps'
            }
        }

        stage('Health Check') {
            steps {
                echo '========== Waiting for services =========='
                sh 'sleep 10'
                sh 'curl -s http://localhost:9090/ || echo "Prometheus not ready yet"'
                sh 'curl -s http://localhost:3001/ || echo "Grafana not ready yet"'
            }
        }
    }

    post {
        always {
            echo '========== Pipeline Complete =========='
            sh 'docker ps'
        }
        success {
            echo '✅ Pipeline SUCCESS'
            echo 'Services running at:'
            echo '  - Backend: http://localhost:5000'
            echo '  - Frontend: http://localhost:3000'
            echo '  - Prometheus: http://localhost:9090'
            echo '  - Grafana: http://localhost:3001'
        }
        failure {
            echo '❌ Pipeline FAILED'
            sh 'docker compose -f docker-compose.yml -f monitoring/docker-compose-monitoring.yml logs || true'
        }
    }
}