#!/bin/bash

# Financial Advisor AI - Quick Setup Script
# This script automates the initial setup process

set -e

echo "🚀 Financial Advisor AI - Quick Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js $(node --version) detected"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✓ Docker $(docker --version | cut -d' ' -f3 | tr -d ',') detected"
echo ""

# Step 1: Install Dependencies
echo "📦 Step 1: Installing dependencies..."
echo ""

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✓ Dependencies installed"
echo ""

# Step 2: Set up environment files
echo "⚙️  Step 2: Setting up environment files..."
echo ""

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✓ Created backend/.env"
    echo "⚠️  Please edit backend/.env and add your API keys and OAuth credentials"
else
    echo "✓ backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✓ Created frontend/.env"
else
    echo "✓ frontend/.env already exists"
fi

echo ""

# Step 3: Start Docker services
echo "🐳 Step 3: Starting database services..."
echo ""

# Use modern docker compose command (with space)
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo "✓ Database services started"
echo ""

# Step 4: Run migrations
echo "📊 Step 4: Running database migrations..."
echo ""

cd backend
npm run migrate
cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your API keys:"
echo "   - OPENAI_API_KEY (required)"
echo "   - Google OAuth credentials"
echo "   - HubSpot OAuth credentials"
echo ""
echo "2. Follow the OAuth setup guide in SETUP_GUIDE.md"
echo ""
echo "3. Start the application:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "📚 See README.md and SETUP_GUIDE.md for detailed instructions"
echo ""
