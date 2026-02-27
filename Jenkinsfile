// ======================================================
// FINTECHOPS – PRODUCTION CI/CD PIPELINE
// ======================================================

pipeline {
    agent any

    parameters {
        string(
            name: 'SERVICES',
            defaultValue: '',
            description: 'Optional: frontend,api-gateway'
        )
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        AWS_ACCOUNT_ID = '196390795701'
        AWS_REGION     = 'ap-south-1'
        APP_NAME       = 'fintechops'
        SONAR_HOST_URL = 'http://sonarqube:9000'
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }

    stages {

        // ======================================================
        // CHECKOUT
        // ======================================================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()

                    env.IMAGE_TAG = "${BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                    env.GIT_BRANCH_NAME = env.BRANCH_NAME ?: "detached"

                    echo "Branch: ${env.GIT_BRANCH_NAME}"
                    echo "Tag: ${env.IMAGE_TAG}"
                }
            }
        }

        // ======================================================
        // SONARQUBE SCAN
        // ======================================================
        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh """
                            sonar-scanner \
                              -Dsonar.host.url=${SONAR_HOST_URL} \
                              -Dsonar.login=${SONAR_TOKEN} \
                              -Dsonar.projectKey=${APP_NAME} \
                              -Dsonar.sources=frontend/src,services \
                              -Dsonar.exclusions=**/node_modules/**,**/build/**
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ======================================================
        // ECR LOGIN
        // ======================================================
        stage('Login to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    """
                }
            }
        }

        // ======================================================
        // BUILD + SCAN + PUSH (PARALLEL)
        // ======================================================
        stage('Build, Scan & Push') {
            steps {
                script {

                    def services = [
                        frontend      : "frontend",
                        "api-gateway" : "services/api-gateway"
                    ]

                    if (params.SERVICES?.trim()) {
                        def requested = params.SERVICES.split(',')*.trim()
                        services = services.findAll { requested.contains(it.key) }
                    }

                    def builds = services.collectEntries { name, path ->
                        ["${name}" : {

                            def image = "${ECR_REGISTRY}/${name}"

                            echo "Building ${name}..."

                            sh """
                                docker pull ${image}:latest || true

                                docker build \
                                  --cache-from ${image}:latest \
                                  --pull \
                                  -t ${image}:${IMAGE_TAG} \
                                  -t ${image}:latest \
                                  ${path} || \

                                docker build \
                                  --no-cache \
                                  --pull \
                                  -t ${image}:${IMAGE_TAG} \
                                  -t ${image}:latest \
                                  ${path}
                            """

                            echo "Scanning ${name} with Trivy..."

                            sh """
                                trivy image \
                                  --exit-code 1 \
                                  --severity CRITICAL \
                                  ${image}:${IMAGE_TAG}
                            """

                            echo "Pushing ${name}..."

                            sh """
                                docker push ${image}:${IMAGE_TAG}
                                docker push ${image}:latest
                            """
                        }]
                    }

                    parallel builds
                }
            }
        }

        // ======================================================
        // GITOPS UPDATE
        // ======================================================
        stage('Update K8s Manifests') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-token', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    script {

                        def environment = (env.GIT_BRANCH_NAME == "main") ? "production" : "staging"

                        sh """
                            git config user.email "jenkins@fintechops.com"
                            git config user.name "Jenkins CI"

                            cd k8s/overlays/${environment}

                            sed -i "s|newTag: .*|newTag: ${IMAGE_TAG}|g" kustomization.yaml

                            cd ../../..

                            git add k8s/

                            git diff --cached --quiet || {
                                git commit -m "[CI] Update images to ${IMAGE_TAG}"
                                git push https://${GIT_USER}:${GIT_TOKEN}@github.com/31RahulPatel/fintechapp.git HEAD:main
                            }
                        """

                        echo "GitOps update completed"
                    }
                }
            }
        }
    }

    // ======================================================
    // CLEANUP
    // ======================================================
    post {
        always {
            sh "docker image prune -af || true"
        }

        success {
            echo "✅ PIPELINE SUCCESS – ${IMAGE_TAG}"
        }

        failure {
            echo "❌ PIPELINE FAILED"
        }
    }
}