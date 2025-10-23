#!/bin/bash

# Linux Dependencies Installation Script
# For Full-Stack Application

set -e

echo "========================================"
echo "   Linux Dependencies Installation"
echo "========================================"
echo

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "❌ Cannot detect Linux distribution"
    exit 1
fi

echo "🔍 Detected OS: $OS $VER"
echo

# Function to install packages based on distribution
install_packages() {
    local packages=("$@")
    
    if command -v apt &> /dev/null; then
        echo "📦 Installing packages with apt (Ubuntu/Debian)..."
        sudo apt update
        sudo apt install -y "${packages[@]}"
    elif command -v yum &> /dev/null; then
        echo "📦 Installing packages with yum (CentOS/RHEL)..."
        sudo yum install -y "${packages[@]}"
    elif command -v dnf &> /dev/null; then
        echo "📦 Installing packages with dnf (Fedora)..."
        sudo dnf install -y "${packages[@]}"
    elif command -v pacman &> /dev/null; then
        echo "📦 Installing packages with pacman (Arch Linux)..."
        sudo pacman -S --noconfirm "${packages[@]}"
    elif command -v zypper &> /dev/null; then
        echo "📦 Installing packages with zypper (openSUSE)..."
        sudo zypper install -y "${packages[@]}"
    else
        echo "❌ Package manager not found. Please install the following packages manually:"
        printf '%s\n' "${packages[@]}"
        exit 1
    fi
}

# Required packages
REQUIRED_PACKAGES=(
    "curl"
    "wget"
    "git"
    "lsof"
    "net-tools"
)

echo "📋 Required packages: ${REQUIRED_PACKAGES[*]}"
echo

# Check if packages are already installed
missing_packages=()
for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! command -v "$package" &> /dev/null; then
        missing_packages+=("$package")
    fi
done

if [ ${#missing_packages[@]} -eq 0 ]; then
    echo "✅ All required packages are already installed"
else
    echo "📦 Installing missing packages: ${missing_packages[*]}"
    install_packages "${missing_packages[@]}"
    echo "✅ Packages installed successfully"
fi

echo

# Check Docker installation
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker first:"
    echo "  Visit: https://docs.docker.com/get-docker/"
    echo "  Or use your distribution's package manager"
    exit 1
else
    echo "✅ Docker is installed: $(docker --version)"
fi

# Check Docker Compose installation
echo "🐳 Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "Please install Docker Compose first:"
    echo "  Visit: https://docs.docker.com/compose/install/"
    exit 1
else
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose is installed: $(docker-compose --version)"
    else
        echo "✅ Docker Compose V2 is installed: $(docker compose version)"
    fi
fi

echo

# Check Docker service status
echo "🔍 Checking Docker service status..."
if ! systemctl is-active --quiet docker; then
    echo "⚠️  Docker service is not running. Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "✅ Docker service started and enabled"
else
    echo "✅ Docker service is running"
fi

echo

# Check if user is in docker group
echo "👤 Checking Docker group membership..."
if ! groups $USER | grep -q docker; then
    echo "⚠️  User $USER is not in docker group"
    echo "Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "✅ User added to docker group"
    echo "⚠️  IMPORTANT: You need to log out and log back in for changes to take effect"
    echo "   Or run: newgrp docker"
else
    echo "✅ User is in docker group"
fi

echo

# Test Docker permissions
echo "🧪 Testing Docker permissions..."
if ! docker ps &> /dev/null; then
    echo "❌ Docker permission test failed"
    echo "Please log out and log back in, or run: newgrp docker"
    exit 1
else
    echo "✅ Docker permissions are working"
fi

echo
echo "========================================"
echo "     INSTALLATION COMPLETED!"
echo "========================================"
echo
echo "✅ All dependencies are installed and configured"
echo "🚀 You can now run: ./start.sh"
echo
echo "📋 Next steps:"
echo "  1. If you were added to docker group, log out and log back in"
echo "  2. Run: ./start.sh to start the application"
echo "  3. Or run: docker compose up --build"
echo
