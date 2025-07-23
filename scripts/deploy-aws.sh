#!/bin/bash

# AWS Deployment Script for H1B-Friendly Jobs Platform
# Usage: ./deploy-aws.sh [amplify|s3|ec2]

set -e

DEPLOYMENT_TYPE=${1:-amplify}
BUCKET_NAME="h1b-friendly-jobs-prod"
DISTRIBUTION_ID=""  # Add your CloudFront distribution ID here

echo "🚀 Starting AWS deployment for H1B-Friendly Jobs Platform"
echo "📦 Deployment type: $DEPLOYMENT_TYPE"

# Build the application
echo "🔨 Building application..."
npm run build

case $DEPLOYMENT_TYPE in
  "amplify")
    echo "📱 AWS Amplify deployment"
    echo "✅ Build complete! Push to GitHub to trigger Amplify deployment."
    echo "🌐 Your site will be available at your Amplify domain."
    ;;
    
  "s3")
    echo "☁️  S3 + CloudFront deployment"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Upload to S3
    echo "📤 Uploading to S3 bucket: $BUCKET_NAME"
    aws s3 sync dist/ s3://$BUCKET_NAME --delete --acl public-read
    
    # Invalidate CloudFront cache if distribution ID is provided
    if [ ! -z "$DISTRIBUTION_ID" ]; then
        echo "🔄 Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    fi
    
    echo "✅ S3 deployment complete!"
    echo "🌐 Your site is available at: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
    ;;
    
  "ec2")
    echo "🖥️  EC2 deployment"
    echo "📋 Manual steps required:"
    echo "1. Upload dist/ folder to your EC2 instance"
    echo "2. Copy files to /var/www/html/"
    echo "3. Restart nginx service"
    echo "💡 See AWS_Deployment_Guide.md for detailed instructions"
    ;;
    
  *)
    echo "❌ Invalid deployment type. Use: amplify, s3, or ec2"
    exit 1
    ;;
esac

echo "🎉 Deployment process completed!"
