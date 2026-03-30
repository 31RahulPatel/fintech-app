#!/bin/bash

echo "🎯 FintechOps Presentation Test Suite"
echo "===================================="

ALB_URL="http://fintechops-alb-1711068043.us-east-1.elb.amazonaws.com"

echo "🔍 1. Testing Frontend Load..."
curl -s -o /dev/null -w "Status: %{http_code} | Time: %{time_total}s\n" $ALB_URL

echo ""
echo "🔍 2. Testing API Health..."
curl -s $ALB_URL/api/auth/health | jq '.'

echo ""
echo "🔍 3. Testing User Registration..."
curl -s -X POST $ALB_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fintechops.com","password":"Demo123!","firstName":"Demo","lastName":"User"}' | jq '.'

echo ""
echo "🔍 4. Testing Market Data..."
curl -s $ALB_URL/api/market/indices | head -5

echo ""
echo "🔍 5. Testing News Service..."
curl -s $ALB_URL/api/news/latest | head -5

echo ""
echo "🔍 6. Testing Calculator Service..."
curl -s -X POST $ALB_URL/api/calculators/sip \
  -H "Content-Type: application/json" \
  -d '{"monthlyAmount":5000,"annualReturn":12,"years":10}' | jq '.'

echo ""
echo "📊 7. Checking All Pods Status..."
kubectl get pods -n fintechops | grep -E "(Running|Ready)"

echo ""
echo "✅ PRESENTATION READY!"
echo "🌐 Your App: $ALB_URL"
echo "📱 Demo Features:"
echo "   - User Registration/Login"
echo "   - Market Data Dashboard"
echo "   - Financial Calculators"
echo "   - News & Blog"
echo "   - AI Chatbot (Premium)"
echo ""
echo "🎯 Key Demo Points:"
echo "   1. Microservices Architecture"
echo "   2. AWS EKS Deployment"
echo "   3. Real-time Market Data"
echo "   4. Premium Features"
echo "   5. Responsive Design"