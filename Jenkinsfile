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
        AWS_ACCOUNT_ID = '196390795701'
        AWS_REGION     = 'ap-south-1'
        GITHUB_REPO    = 'https://github.com/31RahulPatel/fintechapp.git'
        APP_NAME       = 'fintechops'
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        SONAR_HOST_URL = "http://3.110.66.135:9000"
        ARGOCD_SERVER  = 'argocd.fintechops.internal'
        SLACK_CHANNEL  = '#fintechops-cicd'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
        timestamps()
        wrap([$class: 'AnsiColorBuildWrapper', colorMapName: 'xterm'])
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

                    env.GIT_COMMIT_MSG = sh(
                        script: "git log -1 --pretty=%B",
                        returnStdout: true
                    ).trim()

                    echo "Branch: ${env.GIT_BRANCH_NAME}"
                    echo "Commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Tag:    ${env.IMAGE_TAG}"
                    echo "Msg:    ${env.GIT_COMMIT_MSG}"
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
                                -Dsonar.projectVersion=${env.IMAGE_TAG} \
                                -Dsonar.sources=frontend/src,services \
                                -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/build/**,**/dist/**,**/*.test.js,**/*.spec.js \
                                -Dsonar.sourceEncoding=UTF-8 \
                                -Dsonar.javascript.lcov.reportPaths=**/coverage/lcov.info
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
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh """
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
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
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

                        def requestedServices = params.SERVICES.split(',').collect { it.trim() }
                        def parallelBuilds = [:]

                        requestedServices.each { svcName ->
                            def ctx = serviceContextMap[svcName]
                            if (!ctx) {
                                echo "WARNING: Unknown service '${svcName}', skipping."
                                return
                            }

                            parallelBuilds[svcName] = {
                                def imageName = "${ECR_REGISTRY}/${APP_NAME}"
                                def svcTag    = "${svcName}-${IMAGE_TAG}"

                                // Ensure ECR repo exists
                                sh """
                                    aws ecr describe-repositories --repository-names ${APP_NAME} --region ${AWS_REGION} || \
                                    aws ecr create-repository --repository-name ${APP_NAME} --region ${AWS_REGION}
                                """

                                sh """
                                    docker pull ${imageName}:${svcName}-latest || true

                                    docker build \
                                      --cache-from ${imageName}:${svcName}-latest \
                                      -t ${imageName}:${svcTag} \
                                      -t ${imageName}:${svcName}-latest \
                                      --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                                      --build-arg GIT_COMMIT=${GIT_COMMIT_SHORT} \
                                      --build-arg ENVIRONMENT=${params.ENVIRONMENT} \
                                      ${ctx}
                                """
                            }
                        }

                        parallel parallelBuilds
                        env.BUILT_SERVICES = requestedServices.join(',')
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
                        parallelScans[service] = {
                            sh """
                                trivy image \
                                --exit-code 1 \
                                --severity CRITICAL,HIGH \
                                --ignore-unfixed \
                                --format table \
                                --output trivy-${service}.txt \
                                ${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG}
                            """
                        }
                    }

                    parallel parallelScans
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-*.txt', allowEmptyArchive: true
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
                        parallelPush[service] = {
                            sh """
                                docker push ${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG}
                                docker push ${ECR_REGISTRY}/${APP_NAME}:${service}-latest
                            """
                        }
                    }

                    parallel parallelPush
                }
            }
        }

        // ===============================
        // UPDATE ARGOCD MANIFESTS
        // ===============================
        stage('Update K8s Manifests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    expression { params.ENVIRONMENT == 'prod' }
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    script {
                        def services = env.BUILT_SERVICES.split(',')
                        sh "git config user.email 'jenkins@fintechops.internal'"
                        sh "git config user.name 'Jenkins CI'"

                        services.each { service ->
                            sh """
                                sed -i 's|${ECR_REGISTRY}/${APP_NAME}:${service}-.*|${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG}|g' \
                                infrastructure/kubernetes/${params.ENVIRONMENT}/${service}-deployment.yaml || true
                            """
                        }

                        sh """
                            git add infrastructure/kubernetes/${params.ENVIRONMENT}/ || true
                            git diff --cached --quiet || git commit -m "ci: update image tags to ${IMAGE_TAG} [skip ci]"
                            git push https://\${GIT_USER}:\${GIT_TOKEN}@github.com/31RahulPatel/fintechapp.git HEAD:${env.GIT_BRANCH_NAME} || true
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                sh "docker image prune -f || true"
                // Clean up built images to free disk space
                if (env.BUILT_SERVICES) {
                    env.BUILT_SERVICES.split(',').each { service ->
                        sh "docker rmi ${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG} || true"
                    }
                }
            }
        }
        success {
            echo "✅ Pipeline succeeded — ${APP_NAME} [${env.IMAGE_TAG}] deployed to ${params.ENVIRONMENT}"
        }
        failure {
            echo "❌ Pipeline failed — Branch: ${env.GIT_BRANCH_NAME} | Tag: ${env.IMAGE_TAG}"
        }
        unstable {
            echo "⚠️ Pipeline unstable — check SonarQube or Trivy reports"
        }
    }
}
