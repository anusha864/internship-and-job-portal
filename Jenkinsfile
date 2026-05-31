pipeline {

    agent any

    stages {

        stage('Clone Code') {
            steps {
                git 'https://github.com/Poojamanaguli26/Intership-portal.git'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Run Containers') {
            steps {
                sh 'docker compose down || true'
                sh 'docker compose up -d'
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    sleep 10
                    echo "Checking running containers..."
                    docker compose ps
                    if command -v curl >/dev/null 2>&1; then
                      echo "Checking frontend endpoint..."
                      curl -f http://localhost:3000/ || true
                      echo "Checking backend endpoint..."
                      curl -f http://localhost:5000/ || true
                    else
                      echo "curl not installed, skipping HTTP checks"
                    fi
                '''
            }
        }

        stage('Check Running Containers') {
            steps {
                sh 'docker ps'
            }
        }
    }
}