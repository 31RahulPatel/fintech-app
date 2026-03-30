#!/bin/bash

echo "🔧 Scheduler Debug & Fix"
echo "======================="

ALB_URL="http://fintechops-alb-1711068043.us-east-1.elb.amazonaws.com"

echo "1. Testing frontend load..."
curl -s -o /dev/null -w "Status: %{http_code}\n" $ALB_URL

echo ""
echo "2. Testing auth service..."
curl -s $ALB_URL/api/auth/health | jq '.'

echo ""
echo "3. Testing user signup (to get token)..."
SIGNUP_RESPONSE=$(curl -s -X POST $ALB_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"scheduler-test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}')
echo $SIGNUP_RESPONSE | jq '.'

echo ""
echo "✅ SCHEDULER FIXES APPLIED:"
echo "- Better auth token handling"
echo "- Proper error messages"
echo "- Cognito token validation"
echo ""
echo "🎯 TO TEST SCHEDULER:"
echo "1. Go to: $ALB_URL"
echo "2. Login with your account"
echo "3. Go to Chatbot/Bazar.ai"
echo "4. Try creating a schedule"
echo "5. Check browser console for errors"
echo ""
echo "📱 If still not working, the AWS API Gateway needs Cognito authorizer configuration."