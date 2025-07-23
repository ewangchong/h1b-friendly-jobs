#!/bin/bash

# H1B-Friendly Jobs - Local Development Setup Script for Mac
# This script automates the setup process for running the project locally

echo "🚀 Setting up H1B-Friendly Jobs for local development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the h1b-friendly-jobs directory"
    exit 1
fi

# Set up environment variables
if [ ! -f ".env.local" ]; then
    echo "📋 Setting up environment variables..."
    cp .env.local.example .env.local
    echo "✅ Environment file created (.env.local)"
else
    echo "✅ Environment file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install
elif command -v npm &> /dev/null; then
    echo "Using npm..."
    npm install
else
    echo "❌ No package manager found. Please install npm or pnpm."
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🌐 The app will be available at:"
echo "   http://localhost:5173"
echo ""
echo "👤 Admin access:"
echo "   Email: ewangchong@gmail.com"
echo "   URL: http://localhost:5173/admin"
echo ""
echo "📚 Features available:"
echo "   • 161 H1B job listings"
echo "   • Job search and filtering"
echo "   • Company profiles"
echo "   • Admin dashboard"
echo "   • User authentication"
echo ""
