#!/bin/bash

# Full-Stack Application Startup Script for Linux
# Based on artemonsh/deploy-frontend-backend

set -e

echo "========================================"
echo "   Full-Stack Application Startup"
echo "========================================"
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check for required system packages
echo "🔍 Checking for required system packages..."
missing_packages=()

if ! command -v curl &> /dev/null; then
    missing_packages+=("curl")
fi

if [ ${#missing_packages[@]} -ne 0 ]; then
    echo "⚠️  Missing required packages: ${missing_packages[*]}"
    echo "Please install them with:"
    echo "  Ubuntu/Debian: sudo apt install ${missing_packages[*]}"
    echo "  CentOS/RHEL: sudo yum install ${missing_packages[*]}"
    echo "  Fedora: sudo dnf install ${missing_packages[*]}"
    echo
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ All required packages are installed"
fi

# Check Docker permissions
echo "🔍 Checking Docker permissions..."
if ! docker ps &> /dev/null; then
    echo "⚠️  Docker permission denied. You may need to:"
    echo "  1. Add your user to docker group: sudo usermod -aG docker \$USER"
    echo "  2. Log out and log back in"
    echo "  3. Or run with sudo (not recommended)"
    echo
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Docker permissions are OK"
fi
echo

# Check if ports are available
check_port() {
    local port=$1
    # Try multiple methods to check if port is in use
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "⚠️  Port $port is already in use. Please stop the service using this port."
            return 1
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":$port "; then
            echo "⚠️  Port $port is already in use. Please stop the service using this port."
            return 1
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln | grep -q ":$port "; then
            echo "⚠️  Port $port is already in use. Please stop the service using this port."
            return 1
        fi
    else
        echo "⚠️  Cannot check port $port (lsof, netstat, ss not available). Continuing..."
    fi
    return 0
}

echo "🔍 Checking if ports are available..."
if ! check_port 80; then
    echo "Port 80 is in use. You may need to stop other web servers (Apache, Nginx, etc.)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if ! check_port 3000; then
    echo "Port 3000 is in use. You may need to stop other Node.js applications"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if ! check_port 5000; then
    echo "Port 5000 is in use. You may need to stop other Python applications"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Ports are available"
echo

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/data
echo "✅ Directories created"
echo

# Build and start services
echo "🚀 Building and starting services..."
echo "This may take a few minutes on first run..."
echo

# Use docker-compose or docker compose based on what's available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

$COMPOSE_CMD up --build -d

echo
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Check backend
if curl -f http://localhost:5000/health >/dev/null 2>&1; then
    echo "✅ Backend is running on port 5000"
else
    echo "⚠️  Backend may not be ready yet"
fi

# Check frontend
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Frontend is running on port 3000"
else
    echo "⚠️  Frontend may not be ready yet"
fi

# Check nginx
if curl -f http://localhost/health >/dev/null 2>&1; then
    echo "✅ Nginx is running on port 80"
else
    echo "⚠️  Nginx may not be ready yet"
fi

echo
echo "========================================"
echo "        APPLICATION IS RUNNING!"
echo "========================================"
echo
echo "🌐 Application URL: http://localhost"
echo "🔧 Backend API: http://localhost/api"
echo "📊 Health Check: http://localhost/health"
echo
echo "📋 Service URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:5000"
echo "   - Nginx:    http://localhost:80"
echo
echo "🛠️  Management Commands:"
echo "   - View logs: $COMPOSE_CMD logs -f"
echo "   - Stop:     $COMPOSE_CMD down"
echo "   - Restart:  $COMPOSE_CMD restart"
echo
echo "📱 Opening application in browser..."
sleep 2

# Try to open browser (works on most Linux desktop environments)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost
elif command -v gnome-open &> /dev/null; then
    gnome-open http://localhost
elif command -v kde-open &> /dev/null; then
    kde-open http://localhost
else
    echo "Please open http://localhost in your browser"
fi

echo
echo "Press Ctrl+C to stop the application"
echo "Or run: $COMPOSE_CMD down"
