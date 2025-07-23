# AWS Deployment Guide for H1B-Friendly Jobs Platform

This guide provides multiple options for deploying your H1B jobs website to AWS, from simple to advanced configurations.

## 🚀 Deployment Options Overview

| Method | Complexity | Cost | Best For |
|--------|------------|------|----------|
| **AWS Amplify** | ⭐ Easy | $ Low | Quick deployment, automatic CI/CD |
| **S3 + CloudFront** | ⭐⭐ Medium | $ Low | Custom control, high performance |
| **EC2** | ⭐⭐⭐ Advanced | $$ Medium | Full control, custom configurations |

---

## 🎯 Option 1: AWS Amplify (Recommended - Easiest)

AWS Amplify is perfect for React applications and provides automatic CI/CD from GitHub.

### Step 1: Prepare Your Repository
```bash
# Ensure your GitHub repository is up to date
cd h1b-friendly-jobs
git add .
git commit -m "Prepare for AWS Amplify deployment"
git push origin main
```

### Step 2: Configure Build Settings
Create `amplify.yml` in your project root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 3: AWS Amplify Console Setup
1. **Login to AWS Console** → Navigate to AWS Amplify
2. **Connect Repository**:
   - Choose "GitHub"
   - Select your repository: `ewangchong/h1b-friendly-jobs`
   - Choose branch: `main`
3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Output directory: `dist`
4. **Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://qogxbfgkrtullrvjgrrf.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. **Deploy** → AWS will automatically build and deploy

### Step 4: Custom Domain Setup
1. **Domain Management** → Add domain: `h1bfriendly.com`
2. **SSL Certificate** → Automatically provisioned
3. **DNS Configuration** → Follow AWS instructions for your domain provider

**✅ Result**: Your site will be live at `https://your-app-id.amplifyapp.com` and `https://h1bfriendly.com`

---

## 🎯 Option 2: S3 + CloudFront (High Performance)

For maximum control and performance with global CDN.

### Step 1: Build Your Application
```bash
cd h1b-friendly-jobs
npm run build
```

### Step 2: Create S3 Bucket
```bash
# Install AWS CLI first
aws configure

# Create S3 bucket (bucket name must be globally unique)
aws s3 mb s3://h1b-friendly-jobs-prod

# Configure bucket for static website hosting
aws s3 website s3://h1b-friendly-jobs-prod --index-document index.html --error-document index.html
```

### Step 3: Upload Files to S3
```bash
# Upload build files
aws s3 sync dist/ s3://h1b-friendly-jobs-prod --delete

# Set public read permissions
aws s3api put-bucket-policy --bucket h1b-friendly-jobs-prod --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::h1b-friendly-jobs-prod/*"
    }
  ]
}'
```

### Step 4: Configure CloudFront CDN
1. **AWS Console** → CloudFront → Create Distribution
2. **Origin Settings**:
   - Origin Domain: `h1b-friendly-jobs-prod.s3-website-us-east-1.amazonaws.com`
   - Protocol: HTTP only
3. **Default Cache Behavior**:
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
4. **Custom Error Pages**:
   - Error Code: 403, 404
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

### Step 5: Custom Domain & SSL
1. **Request SSL Certificate** (AWS Certificate Manager)
2. **Add CNAME**: `h1bfriendly.com` → CloudFront distribution domain
3. **Update DNS** in your domain provider

---

## 🎯 Option 3: EC2 (Advanced Control)

For full server control and custom configurations.

### Step 1: Launch EC2 Instance
1. **AWS Console** → EC2 → Launch Instance
2. **AMI**: Amazon Linux 2
3. **Instance Type**: t3.micro (free tier) or t3.small
4. **Security Group**: 
   - HTTP (80), HTTPS (443), SSH (22)
5. **Key Pair**: Create or use existing

### Step 2: Server Setup
```bash
# SSH into your instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js and nginx
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install nginx
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 3: Deploy Application
```bash
# Clone your repository
git clone https://github.com/ewangchong/h1b-friendly-jobs.git
cd h1b-friendly-jobs

# Install dependencies and build
npm install
npm run build

# Copy build files to nginx
sudo cp -r dist/* /var/www/html/
```

### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/nginx.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name h1bfriendly.com www.h1bfriendly.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# Restart nginx
sudo systemctl restart nginx
```

---

## 🔒 Environment Variables & Security

### Frontend Environment Variables
Create `.env.production`:
```env
VITE_SUPABASE_URL=https://qogxbfgkrtullrvjgrrf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Security Best Practices
1. **HTTPS Only**: Always use SSL certificates
2. **Environment Variables**: Never commit secrets to GitHub
3. **CORS Configuration**: Update Supabase CORS settings for your domain
4. **Rate Limiting**: Configure CloudFront or nginx rate limiting

---

## 💰 Cost Estimates (Monthly)

### AWS Amplify
- **Build minutes**: $0.01/minute (first 1000 free)
- **Hosting**: $0.15/GB served (first 15GB free)
- **Estimate**: $5-15/month for moderate traffic

### S3 + CloudFront
- **S3 Storage**: $0.023/GB (first 5GB free)
- **CloudFront**: $0.085/GB for first 10TB
- **Estimate**: $10-30/month for moderate traffic

### EC2
- **t3.micro**: $8.5/month (free tier eligible)
- **t3.small**: $17/month
- **Estimate**: $10-25/month

---

## 🚀 Recommended Deployment Strategy

**For Quick Launch**: Start with **AWS Amplify**
- Fastest setup (30 minutes)
- Automatic deployments from GitHub
- Built-in SSL and CDN
- Perfect for getting h1bfriendly.com live quickly

**For Production Scale**: Upgrade to **S3 + CloudFront**
- Better performance and control
- Lower costs at scale
- More configuration options
- Professional production setup

---

## 📋 Next Steps Checklist

1. **Choose deployment method** based on your needs
2. **Set up AWS account** if you don't have one
3. **Configure environment variables** for production
4. **Deploy the application** following the chosen method
5. **Set up custom domain** (h1bfriendly.com)
6. **Configure SSL certificate** for HTTPS
7. **Update DNS settings** with your domain provider
8. **Test the deployment** thoroughly
9. **Set up monitoring** and backups

Would you like me to help you implement any of these deployment options?