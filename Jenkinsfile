pipeline {
    agent any

    environment {
        IMAGE_NAME = 'uniuni-tracking'
        CONTAINER_NAME = 'uniuni-tracking'
        PORT = '8090'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME .'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker stop $CONTAINER_NAME 2>/dev/null || true
                    docker rm $CONTAINER_NAME 2>/dev/null || true
                    docker run -d \
                        --name $CONTAINER_NAME \
                        -p $PORT:80 \
                        --restart unless-stopped \
                        $IMAGE_NAME
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo 'Deployed: https://prm.dev.uniuni.ca/tracking/'
        }
        failure {
            echo 'Deploy failed'
        }
    }
}
