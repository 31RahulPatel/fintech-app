// ============================================
// FintechOps CI/CD Pipeline
// ============================================
// Flow: GitHub Push → Jenkins (Webhook) → SonarQube Scan → Docker Build →
//       Trivy Scan → ECR Push → Update K8s Manifests → ArgoCD Auto-Sync → EKS
//
// Prerequisites on Jenkins:
//   - Credentials: aws-credentials (AWS Access Key), sonar-token, github-token
//   - Tools: Docker, AWS CLI, Trivy, SonarQube Scanner, kubectl, kustomize

pipeline {
    agent any

    parameters {
        string(
            name: 'SERVICES',
            defaultValue: 'frontend,api-gateway',
            description: 'Comma-separated list of services to build (e.g. frontend,api-gateway)'
        )
    }

    environment {
        // ---- CHANGE THESE ----
        AWS_ACCOUNT_ID   = '196390795701'
        AWS_REGION       = 'ap-south-1'
        GITHUB_REPO      = 'https://github.com/31RahulPatel/fintechapp.git'  // e.g. https://github.com/user/fintechops.git
        DOMAIN           = '<YOUR_DOMAIN>'            // e.g. fintechops.com
        // ---- END CHANGE ----

        APP_NAME         = 'fintechops'
        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        IMAGE_TAG        = "${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
        SONAR_HOST_URL   = "http://sonarqube:9000"    // SonarQube on same EC2 Docker network
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
    }

    stages {
        // ============================================
        // STAGE 1: CHECKOUT
        // ============================================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Jenkins checks out a specific commit, so git may show "HEAD" (detached).
                    // Prefer Jenkins-provided branch name when available.
                    env.GIT_BRANCH_NAME = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    echo "Branch: ${env.GIT_BRANCH_NAME} | Commit: ${GIT_COMMIT_SHORT} | Tag: ${IMAGE_TAG}"

                    // Detect changed services for selective builds
                    env.CHANGED_SERVICES = sh(
                        script: '''
                            git diff --name-only HEAD~1 HEAD 2>/dev/null | \
                            grep -oE '(frontend|services/[^/]+)' | \
                            sed 's|services/||' | sort -u | tr '\\n' ',' | sed 's/,$//'
                        ''',
                        returnStdout: true
                    ).trim()

                    if (env.CHANGED_SERVICES == '') {
                        env.CHANGED_SERVICES = 'all'
                    }
                    echo "Changed services: ${env.CHANGED_SERVICES}"
                }
            }
        }

        // ============================================
        // STAGE 2: SONARQUBE CODE ANALYSIS
        // ============================================
        stage('SonarQube Analysis') {
            steps {
                script {
                    // Required for waitForQualityGate: this wrapper attaches the Sonar analysis to the build.
                    // Matches the SonarQube server name configured in Jenkins ("SonarQube").
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                            def scannerHome = tool 'SonarScanner'
                            sh """
                                ${scannerHome}/bin/sonar-scanner \\
                                    -Dsonar.host.url=${SONAR_HOST_URL} \\
                                    -Dsonar.login=${SONAR_TOKEN} \\
                                    -Dsonar.projectKey=${APP_NAME} \\
                                    -Dsonar.projectName=FintechOps \\
                                    -Dsonar.sources=frontend/src,services \\
                                    -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/build/**,**/dist/**,**/*.test.js,**/*.spec.js \\
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

        // ============================================
        // STAGE 3: BUILD DOCKER IMAGES
        // ============================================
        stage('Build Docker Images') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    script {
                        // Login to ECR using AWS CLI Docker image (no awscli required in Jenkins container)
                        sh """
                            docker run --rm \\
                                -e AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID} \\
                                -e AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} \\
                                -e AWS_DEFAULT_REGION=${AWS_REGION} \\
                                amazon/aws-cli ecr get-login-password --region ${AWS_REGION} | \\
                                docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        """

                        // Only include services that exist in this repo
                        def allServices = [
                            [name: 'frontend',    context: 'frontend'],
                            [name: 'api-gateway', context: 'services/api-gateway'],
                        ]

                        // Determine which services to build:
                        // 1) If SERVICES param is set, honor that list
                        // 2) Otherwise, fall back to CHANGED_SERVICES detection
                        def servicesToBuild = allServices
                        if (params.SERVICES?.trim()) {
                            def requested = params.SERVICES.split(',').collect { it.trim() }
                            servicesToBuild = allServices.findAll { svc -> requested.contains(svc.name) }
                        } else if (env.CHANGED_SERVICES != 'all') {
                            def changedList = env.CHANGED_SERVICES.split(',').collect { it.trim() }
                            servicesToBuild = allServices.findAll { svc ->
                                changedList.contains(svc.name)
                            }
                        }

                        if (servicesToBuild.isEmpty()) {
                            echo "No matching services for selection, building all..."
                            servicesToBuild = allServices
                        }

                        servicesToBuild.each { svc ->
                            def imageName = "${ECR_REGISTRY}/${APP_NAME}"
                            def svcTag = "${svc.name}-${IMAGE_TAG}"
                            echo "Building ${svc.name}..."
                            sh """
                                # Pull latest image to warm Docker cache (if it exists)
                                docker pull ${imageName}:${svc.name}-latest || true

                                docker build \\
                                    --cache-from ${imageName}:${svc.name}-latest \\
                                    -t ${imageName}:${svcTag} \\
                                    -t ${imageName}:${svc.name}-latest \\
                                    --build-arg BUILD_NUMBER=${BUILD_NUMBER} \\
                                    --build-arg GIT_COMMIT=${GIT_COMMIT_SHORT} \\
                                    ${svc.context}
                            """
                        }

                        // Store which services were built
                        env.BUILT_SERVICES = servicesToBuild.collect { it.name }.join(',')
                    }
                }
            }
        }

        // ============================================
        // STAGE 4: TRIVY SECURITY SCAN
        // ============================================
        stage('Trivy Security Scan') {
            steps {
                script {
                    def services = env.BUILT_SERVICES.split(',')
                    def scanFailed = false

                    services.each { service ->
                        def imageName = "${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG}"

                        // Generate scan report
                        sh """
                            trivy image \
                                --exit-code 0 \
                                --severity HIGH,CRITICAL \
                                --format table \
                                ${imageName} | tee trivy-report-${service}.txt
                        """

                        // Fail on CRITICAL vulnerabilities only
                        def exitCode = sh(
                            script: """
                                trivy image \
                                    --exit-code 1 \
                                    --severity CRITICAL \
                                    --quiet \
                                    ${ECR_REGISTRY}/${APP_NAME}:${service}-${IMAGE_TAG}
                            """,
                            returnStatus: true
                        )

                        if (exitCode != 0) {
                            echo "WARNING: CRITICAL vulnerabilities found in ${service}"
                            scanFailed = true
                        }
                    }

                    if (scanFailed) {
                        echo "⚠ CRITICAL vulnerabilities detected. Review trivy reports."
                        // Uncomment below to fail the build on CRITICAL vulns:
                        // error("Critical vulnerabilities found!")
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report-*.txt', allowEmptyArchive: true
                }
            }
        }

        // ============================================
        // STAGE 5: PUSH TO ECR
        // ============================================
        stage('Push to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    script {
                        sh """
                            docker run --rm \\
                                -e AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID} \\
                                -e AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY} \\
                                -e AWS_DEFAULT_REGION=${AWS_REGION} \\
                                amazon/aws-cli ecr get-login-password --region ${AWS_REGION} | \\
                                docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        """

                        def services = env.BUILT_SERVICES.split(',')
                        services.each { service ->
                            def imageName = "${ECR_REGISTRY}/${APP_NAME}"
                            echo "Pushing ${service} to ECR..."
                            sh """
                                docker push ${imageName}:${service}-${IMAGE_TAG}
                                docker push ${imageName}:${service}-latest
                            """
                        }
                    }
                }
            }
        }

        // ============================================
        // STAGE 6: UPDATE K8S MANIFESTS (GitOps)
        // ArgoCD will auto-sync from these changes
        // ============================================
        stage('Update K8s Manifests') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-token', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    script {
                        def environment = 'staging'
                        if (env.GIT_BRANCH_NAME == 'main') {
                            environment = 'production'
                        }

                        def services = env.BUILT_SERVICES.split(',')

                        sh """
                            git config user.email "jenkins@fintechops.com"
                            git config user.name "Jenkins CI"
                        """

                        // Update kustomization overlay with new image tags
                        // Single ECR repo: fintechops, tags: <service>-<build>-<commit>
                        services.each { service ->
                            sh """
                                cd k8s/overlays/${environment}

                                # Update image tag for this service
                                sed -i "s|newTag: ${service}-.*|newTag: ${service}-${IMAGE_TAG}|" kustomization.yaml

                                cd ../../..
                            """
                        }

                        // Commit and push K8s manifest changes back to main branch
                        sh """
                            git add k8s/
                            git diff --cached --quiet || {
                                git commit -m "[CI] Update ${environment} images to ${IMAGE_TAG}"
                                git push https://\${GIT_USER}:\${GIT_TOKEN}@\$(echo ${GITHUB_REPO} | sed 's|https://||') HEAD:refs/heads/main
                            }
                        """

                        echo "✓ K8s manifests updated. ArgoCD will auto-sync to EKS."
                    }
                }
            }
        }
    }

    // ============================================
    // POST ACTIONS
    // ============================================
    post {
        always {
            script {
                // Clean up Docker images to save disk space
                sh """
                    docker images --filter "reference=${ECR_REGISTRY}/${APP_NAME}" -q | xargs -r docker rmi -f || true
                    docker image prune -f || true
                """
            }
        }
        success {
            echo """
            ╔══════════════════════════════════════════╗
            ║  ✓ CI PIPELINE SUCCESSFUL                ║
            ║  Branch: ${env.GIT_BRANCH_NAME}          ║
            ║  Tag: ${IMAGE_TAG}                       ║
            ║  Services: ${env.BUILT_SERVICES ?: 'all'} ║
            ╚══════════════════════════════════════════╝
            """
        }
        failure {
            echo """
            ╔══════════════════════════════════════════╗
            ║  ✗ CI PIPELINE FAILED                    ║
            ║  Branch: ${env.GIT_BRANCH_NAME}          ║
            ║  Check console output for details        ║
            ╚══════════════════════════════════════════╝
            """
        }
    }
}
