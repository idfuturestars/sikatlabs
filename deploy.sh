#!/bin/bash

# EiQ Platform Deployment Script
# This script handles deployment to Google Cloud Run or other containerized platforms

set -e  # Exit on any error

echo "🚀 EiQ Platform Deployment Script"
echo "=================================="

# Configuration
PROJECT_NAME="eiq-platform"
IMAGE_NAME="gcr.io/YOUR_PROJECT_ID/eiq-platform"
SERVICE_NAME="eiq-platform"
REGION="us-central1"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please ensure Dockerfile is in the project root."
    exit 1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

# Test the image locally (optional)
echo "🧪 Testing image locally..."
docker run --rm -p 8080:5000 -d --name eiq-test $IMAGE_NAME

# Wait a moment for the container to start
sleep 5

# Test health endpoints
echo "🏥 Testing health endpoints..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check endpoint working"
else
    echo "❌ Health check endpoint failed"
    docker stop eiq-test || true
    exit 1
fi

if curl -f http://localhost:8080/ready > /dev/null 2>&1; then
    echo "✅ Readiness check endpoint working"
else
    echo "❌ Readiness check endpoint failed"
    docker stop eiq-test || true
    exit 1
fi

# Stop the test container
docker stop eiq-test

# Push to Google Container Registry (requires gcloud CLI)
echo "📤 Pushing to Google Container Registry..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "☁️ Deploying to Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --region $REGION \
    --platform managed \
    --port 5000 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 100 \
    --min-instances 0 \
    --timeout 300s \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080

echo "✅ Deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "- Service Name: $SERVICE_NAME"
echo "- Region: $REGION"
echo "- Image: $IMAGE_NAME"
echo "- Health Check: /health"
echo "- Readiness Check: /ready"
echo ""
echo "🔗 Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
echo ""
echo "📊 To view logs:"
echo "gcloud logs tail --follow --resource-type cloud_run_revision --resource-labels service_name=$SERVICE_NAME"