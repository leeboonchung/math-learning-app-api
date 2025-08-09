#!/bin/bash

# Test script for Vercel deployment
# Usage: ./test-deployment.sh <your-vercel-url>

VERCEL_URL=$1

if [ -z "$VERCEL_URL" ]; then
    echo "Usage: ./test-deployment.sh <your-vercel-url>"
    echo "Example: ./test-deployment.sh https://math-learning-app-api.vercel.app"
    exit 1
fi

echo "Testing Vercel deployment at: $VERCEL_URL"
echo "========================================"

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$VERCEL_URL/api/health" | jq '.' || echo "Health check failed"
echo ""

# Test API docs
echo "2. Testing API documentation..."
curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL/api-docs"
echo " - API docs status code"
echo ""

# Test lessons endpoint (no auth required)
echo "3. Testing lessons endpoint..."
curl -s "$VERCEL_URL/api/lessons" | jq '.' || echo "Lessons endpoint failed"
echo ""

echo "Deployment test completed!"
echo "Visit $VERCEL_URL/api-docs to see the full API documentation"
