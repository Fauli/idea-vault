#!/bin/bash
# SSL setup script using Let's Encrypt
# Run this on your server after deploying

set -e

DOMAIN=${1:-$DOMAIN}

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./scripts/setup-ssl.sh your-domain.com"
    echo "Or set DOMAIN environment variable"
    exit 1
fi

echo "Setting up SSL for: $DOMAIN"

# Create directories
mkdir -p docker/ssl
mkdir -p /var/www/certbot

# Generate self-signed cert first (for nginx to start)
if [ ! -f docker/ssl/fullchain.pem ]; then
    echo "Creating temporary self-signed certificate..."
    openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
        -keyout docker/ssl/privkey.pem \
        -out docker/ssl/fullchain.pem \
        -subj "/CN=$DOMAIN"
fi

# Start nginx with temporary cert
echo "Starting nginx..."
docker compose -f docker-compose.prod.yml up -d nginx

# Get real certificate from Let's Encrypt
echo "Obtaining Let's Encrypt certificate..."
docker run --rm \
    -v "$(pwd)/docker/ssl:/etc/letsencrypt/live/$DOMAIN" \
    -v "/var/www/certbot:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Copy certificates
echo "Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/ssl/

# Reload nginx
echo "Reloading nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "SSL setup complete for $DOMAIN"
echo ""
echo "To auto-renew, add this to crontab:"
echo "0 0 1 * * cd $(pwd) && docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload"
