#!/bin/bash
set -e

# FintechOps AWS Scheduler Deployment Script
# Usage: ./deploy.sh [environment]

ENVIRONMENT=${1:-dev}
STACK_NAME="fintechops-scheduler-${ENVIRONMENT}"
REGION=${AWS_REGION:-us-east-1}

echo "🚀 Deploying FintechOps Scheduler to AWS..."
echo "   Environment: ${ENVIRONMENT}"
echo "   Stack: ${STACK_NAME}"
echo "   Region: ${REGION}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install: https://aws.amazon.com/cli/"
    exit 1
fi

# Check SAM CLI
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI not found. Please install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Check required environment variables
check_env() {
    if [ -z "${!1}" ]; then
        echo "❌ Missing required environment variable: $1"
        echo "   Export it with: export $1=<value>"
        exit 1
    fi
}

check_env "GROQ_API_KEY"
check_env "JWT_SECRET"
check_env "SES_FROM_EMAIL"
check_env "FRONTEND_URL"

echo "✅ Environment variables verified"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
for dir in lambda/*/; do
    if [ -f "${dir}package.json" ]; then
        echo "   Installing ${dir}..."
        (cd "$dir" && npm install --production --silent)
    fi
done
echo "✅ Dependencies installed"
echo ""

# Build with SAM
echo "🔨 Building SAM application..."
sam build --use-container
echo "✅ Build complete"
echo ""

# Deploy with SAM
echo "☁️  Deploying to AWS..."
sam deploy \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        GroqApiKey="$GROQ_API_KEY" \
        JwtSecret="$JWT_SECRET" \
        SesFromEmail="$SES_FROM_EMAIL" \
        FrontendUrl="$FRONTEND_URL" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

echo ""
echo "✅ Deployment complete!"
echo ""

# Get outputs
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "🎉 FintechOps Scheduler is now live!"
echo ""
echo "Next steps:"
echo "  1. Verify your SES email (${SES_FROM_EMAIL}) if not already verified"
echo "  2. Update your frontend to use the API Gateway URL"
echo "  3. Test creating a schedule from the UI"
echo ""
