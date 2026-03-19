pipeline {
    agent any

    parameters {
        string(
            name: 'SERVICES',
            defaultValue: 'frontend,api-gateway,auth-service,user-service,market-service,news-service,blog-service,calculator-service,chatbot-service,email-service,admin-service',
            description: 'Comma-separated list of services to build'
        )
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'prod'],
            description: 'Target deployment environment'
        )
        booleanParam(
            name: 'SKIP_SONAR',
            defaultValue: false,
            description: 'Skip SonarQube analysis'
        )
        booleanParam(
            name: 'SKIP_TRIVY',
            defaultValue: false,
            description: 'Skip Trivy security scan'
        )
    }

    environment {
        AWS_ACCOUNT_ID = '836548370285'
        AWS_REGION     = 'us-east-1'
        APP_NAME       = 'fintechops'
        GITHUB_REPO    = 'https://github.com/31RahulPatel/fintech-app.git'
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        SONAR_HOST_URL = "http://100.26.189.213:9000"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        // ===============================
        // CHECKOUT
        // ===============================
        stage('Checkout') {
            steps {
                cleanWs()
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/31RahulPatel/fintech-app.git']]
                ])
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

                    env.GIT_COMMIT_MSG = sh(
                        script: "git log -1 --pretty=%B",
                        returnStdout: true
                    ).trim()

                    echo "Branch: ${env.GIT_BRANCH_NAME}"
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Tag:    ${env.IMAGE_TAG}"
                    echo "Msg:    ${env.GIT_COMMIT_MSG}"
                    
                    // Verify services directory exists
                    sh "ls -la"
                    sh "ls -la services/ || echo 'services directory not found'"
                }
            }
        }

        // ===============================
        // SONARQUBE ANALYSIS
        // ===============================
        stage('SonarQube Analysis') {
            when {
                expression { return !params.SKIP_SONAR }
            }
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQube') {
                        script {
                            def scannerHome = tool name: 'SonarScanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.token=\$SONAR_TOKEN \
                                -Dsonar.projectKey=${APP_NAME} \
                                -Dsonar.projectName=FintechOps \
                                -Dsonar.projectVersion=${BUILD_NUMBER} \
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
            when {
                expression { return !params.SKIP_SONAR }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ===============================
        // ECR LOGIN
        // ===============================
        stage('ECR Login') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-credentials',
                     accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                     secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']
                ]) {
                    sh """
                        export PATH=\$PATH:/usr/local/bin:/usr/bin
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    """
                }
            }
        }

        // ===============================
        // BUILD DOCKER IMAGES (Parallel)
        // ===============================
        stage('Build Docker Images') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-credentials',
                     accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                     secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']
                ]) {
                    script {
                        def serviceContextMap = [
                            'frontend'           : 'frontend',
                            'api-gateway'        : 'services/api-gateway',
                            'auth-service'       : 'services/auth-service',
                            'user-service'       : 'services/user-service',
                            'market-service'     : 'services/market-service',
                            'news-service'       : 'services/news-service',
                            'blog-service'       : 'services/blog-service',
                            'calculator-service' : 'services/calculator-service',
                            'chatbot-service'    : 'services/chatbot-service',
                            'email-service'      : 'services/email-service',
                            'admin-service'      : 'services/admin-service'
                        ]

                        def requestedServices = params.SERVICES.split(',').collect { it.trim() }.findAll { serviceContextMap.containsKey(it) }
                        env.BUILT_SERVICES = requestedServices.join(',')

                        def parallelBuilds = [:]
                        requestedServices.each { svcName ->
                            def ctx       = serviceContextMap[svcName]
                            def imageName = "${ECR_REGISTRY}/${APP_NAME}"
                            def svcTag    = "${svcName}-${env.IMAGE_TAG}"

                            parallelBuilds[svcName] = {
                                sh """
                                    export PATH=\$PATH:/usr/local/bin:/usr/bin
                                    aws ecr describe-repositories --repository-names ${APP_NAME} --region ${AWS_REGION} 2>/dev/null || \
                                    aws ecr create-repository --repository-name ${APP_NAME} --region ${AWS_REGION}

                                    docker pull ${imageName}:${svcName}-latest || true

                                    docker build \
                                      --cache-from ${imageName}:${svcName}-latest \
                                      -t ${imageName}:${svcTag} \
                                      -t ${imageName}:${svcName}-latest \
                                      --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                                      --build-arg GIT_COMMIT=${env.GIT_COMMIT_SHORT} \
                                      --build-arg ENVIRONMENT=${params.ENVIRONMENT} \
                                      ${ctx}
                                """
                            }
                        }

                        parallel parallelBuilds
                    }
                }
            }
        }

        // ===============================
        // TRIVY SCAN (Parallel)
        // ===============================
        stage('Trivy Scan') {
            when {
                expression { return !params.SKIP_TRIVY }
            }
            steps {
                script {
                    def services = env.BUILT_SERVICES.split(',')
                    def parallelScans = [:]

                    services.each { service ->
                        def svc = service
                        parallelScans[svc] = {
                            sh """
                                trivy image \
                                --exit-code 0 \
                                --severity CRITICAL,HIGH \
                                --ignore-unfixed \
                                --format table \
                                --output trivy-${svc}.txt \
                                ${ECR_REGISTRY}/${APP_NAME}:${svc}-${env.IMAGE_TAG}
                            """
                        }
                    }

                    parallel parallelScans
                }
            }
        }

        // ===============================
        // PUSH TO ECR (Parallel)
        // ===============================
        stage('Push to ECR') {
            steps {
                script {
                    def services = env.BUILT_SERVICES.split(',')
                    def parallelPush = [:]

                    services.each { service ->
                        def svc = service
                        parallelPush[svc] = {
                            sh """
                                docker push ${ECR_REGISTRY}/${APP_NAME}:${svc}-${env.IMAGE_TAG}
                                docker push ${ECR_REGISTRY}/${APP_NAME}:${svc}-latest
                            """
                        }
                    }

                    parallel parallelPush
                }
            }
        }

    }

    post {
        always {
            script {
                archiveArtifacts artifacts: 'trivy-*.txt', allowEmptyArchive: true
                sh "docker image prune -f || true"
                if (env.BUILT_SERVICES && env.IMAGE_TAG) {
                    env.BUILT_SERVICES.split(',').each { service ->
                        sh "docker rmi ${ECR_REGISTRY}/${APP_NAME}:${service}-${env.IMAGE_TAG} || true"
                    }
                }
            }
        }
        success {
            echo "Pipeline succeeded — ${APP_NAME} [${env.IMAGE_TAG ?: 'unknown'}] on ${params.ENVIRONMENT}"
        }
        failure {
            echo "Pipeline failed — Branch: ${env.GIT_BRANCH_NAME ?: 'unknown'} | Tag: ${env.IMAGE_TAG ?: 'unknown'}"
        }
        unstable {
            echo "Pipeline unstable — check SonarQube or Trivy reports"
        }
    }
}
