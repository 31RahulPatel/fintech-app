pipeline {
    agent any

    parameters {
        string(
            name: 'SERVICES',
            defaultValue: 'frontend,api-gateway',
            description: 'Comma-separated list of services to build'
        )
    }

    environment {
        AWS_ACCOUNT_ID = '196390795701'
        AWS_REGION     = 'ap-south-1'
        GITHUB_REPO    = 'https://github.com/31RahulPatel/fintechapp.git'
        APP_NAME       = 'fintechops'
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        SONAR_HOST_URL = "http://3.110.66.135:9000"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
    }

    stages {

        // ===============================
        // CHECKOUT
        // ===============================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()

                    env.IMAGE_TAG = "${BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"

                    env.GIT_BRANCH_NAME = env.BRANCH_NAME ?: sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Branch: ${env.GIT_BRANCH_NAME}"
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Tag: ${env.IMAGE_TAG}"
                }
            }
        }

        // ===============================
        // SONARQUBE ANALYSIS
        // ===============================
        stage('SonarQube Analysis') {
            steps {
                script {
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {

                            def scannerHome = tool 'SonarScanner'

                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.login=\$SONAR_TOKEN \
                                -Dsonar.projectKey=${APP_NAME} \
                                -Dsonar.projectName=FintechOps \
                                -Dsonar.sources=frontend/src,services \
                                -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/build/**,**/dist/**,**/*.test.js,**/*.spec.js \
                                -Dsonar.sourceEncoding=UTF-8
                            """
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        // ===============================
        // BUILD DOCKER IMAGES
        // ===============================
        stage('Build Docker Images') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    script {

                        sh """
                            docker run --rm \
                              -e AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID} \
                              -e AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} \
                              -e AWS_DEFAULT_REGION=${AWS_REGION} \
                              amazon/aws-cli ecr get-login-password --region ${AWS_REGION} | \
                              docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        """

                        def services = [
                            [name: 'frontend', context: 'frontend'],
                            [name: 'api-gateway', context: 'services/api-gateway']
                        ]

                        services.each { svc ->

                            def imageName = "${ECR_REGISTRY}/${APP_NAME}"
                            def svcTag = "${svc.name}-${IMAGE_TAG}"

                            sh """
                                docker pull ${imageName}:${svc.name}-latest || true

                                docker build \
                                  --cache-from ${imageName}:${svc.name}-latest \
                                  -t ${imageName}:${svcTag} \
                                  -t ${imageName}:${svc.name}-latest \
                                  --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                                  --build-arg GIT_COMMIT=${GIT_COMMIT_SHORT} \
                                  ${svc.context}
                            """
                        }

                        env.BUILT_SERVICES = services.collect { it.name }.join(',')
                    }
                }
            }
        }

        // ===============================
        // TRIVY SCAN
        // ===============================
        stage('Trivy Scan') {
            steps {
                script {
                    def services = env.BUILT_SERVICES.split(',')

                    services.each { service ->

                        sh """
                            trivy image \
                            --exit-code 1 \
                            --severity CRITICAL \
                            ${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG}
                        """
                    }
                }
            }
        }

        // ===============================
        // PUSH TO ECR
        // ===============================
        stage('Push to ECR') {
            steps {
                script {
                    def services = env.BUILT_SERVICES.split(',')

                    services.each { service ->

                        sh """
                            docker push ${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/${APP_NAME}:${service}-latest
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh "docker image prune -f || true"
        }
    }
}