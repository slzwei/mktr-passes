#!/bin/bash

# =============================================================================
# DevContainer Post-Create Script
# =============================================================================
# Runs after the DevContainer is created to set up the development environment

set -e

echo "🚀 Setting up Wallet Platform DevContainer..."

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm@8

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y \
    openssl \
    zip \
    unzip \
    curl \
    postgresql-client

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh

# Set up Git (if not already configured)
echo "🔧 Configuring Git..."
git config --global --add safe.directory /workspace || true

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads passes dist

# Set up environment
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env from env.example"
fi

# Build packages
echo "🔨 Building packages..."
pnpm run build

echo "✅ DevContainer setup complete!"
echo ""
echo "🎉 Ready to develop!"
echo ""
echo "Next steps:"
echo "1. Start the development stack: ./scripts/oneclick-up.sh"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Check the docs/00-start-here.md for more information"
echo ""
echo "Happy coding! 🚀"
