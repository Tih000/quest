#!/bin/bash

# QuestGO SSL Setup Script
# Usage: ./setup-ssl.sh

set -e

echo "🔐 Setting up SSL for questgo.ru..."

# Check if running as root (allow root execution)
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root - this is OK for server setup"
fi

# Install Certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    apt update
    apt install -y certbot
fi

# Stop containers to free port 80
echo "🛑 Stopping containers..."
docker-compose down || true

# Stop system nginx if running
echo "🛑 Stopping system nginx..."
systemctl stop nginx || true
systemctl disable nginx || true

# Get SSL certificate
echo "🔐 Getting SSL certificate..."
certbot certonly --standalone -d questgo.ru --non-interactive --agree-tos --email admin@questgo.ru

# Create directory for SSL certificates in nginx container
echo "📁 Creating SSL certificate directory..."
mkdir -p /etc/letsencrypt/live/questgo.ru
chmod 755 /etc/letsencrypt/live/questgo.ru

# SSL certificates are already mounted in docker-compose.yml
echo "📝 SSL certificates are already configured in docker-compose.yml..."

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose restart nginx") | crontab -

echo ""
echo "🎉 SSL setup completed!"
echo ""
echo "📱 Your site is now available at:"
echo "   - https://questgo.ru"
echo "   - https://www.questgo.ru"
echo ""
echo "🔍 Test your SSL setup:"
echo "   curl -I https://questgo.ru"
echo ""
echo "📊 Check certificate status:"
echo "   sudo certbot certificates"
