#!/bin/bash

# QuestGO Deployment Script for Linux
# Usage: ./deploy.sh

set -e

echo "🚀 Starting QuestGO deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file and set your API keys and secrets before continuing."
    echo "   - Set GEMINI_API_KEY to your Google Gemini API key"
    echo "   - Set JWT_SECRET to a secure random string"
    read -p "Press Enter after you've configured the .env file..."
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Remove old images
echo "🗑️  Removing old images..."
docker-compose down --rmi all || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Check backend
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx is healthy"
else
    echo "❌ Nginx health check failed"
    docker-compose logs nginx
    exit 1
fi

echo ""
echo "🎉 QuestGO deployment completed successfully!"
echo ""
echo "📱 Your application is now available at:"
echo "   - https://questgo.ru (via nginx with HTTPS)"
echo "   - http://localhost (local access)"
echo ""
echo "🔐 To setup HTTPS:"
echo "   chmod +x setup-ssl.sh"
echo "   ./setup-ssl.sh"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "📊 Service status:"
docker-compose ps
