#!/bin/bash
set -e

#############################################
# Pocket Ideas - Server Installation Script
#
# Run on a fresh Ubuntu/Debian VM:
#   curl -fsSL https://raw.githubusercontent.com/Fauli/idea-vault/main/scripts/install.sh | bash -s -- your-domain.com
#
# Or download and run:
#   chmod +x install.sh
#   ./install.sh your-domain.com
#############################################

DOMAIN="${1:-}"
APP_DIR="/opt/idea-vault"
REPO_URL="https://github.com/Fauli/idea-vault.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[!]${NC} $1"; exit 1; }

#############################################
# Preflight checks
#############################################

if [ -z "$DOMAIN" ]; then
    error "Usage: $0 <domain>\n    Example: $0 ideas.example.com"
fi

if [ "$EUID" -eq 0 ]; then
    error "Don't run as root. Script will use sudo when needed."
fi

log "Installing Pocket Ideas for domain: $DOMAIN"

#############################################
# Install Docker
#############################################

if command -v docker &> /dev/null; then
    log "Docker already installed"
else
    log "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    warn "Added $USER to docker group. You may need to log out and back in."
fi

# Ensure docker is running (handle both apt and snap installs)
if systemctl list-unit-files docker.service &> /dev/null; then
    sudo systemctl enable docker
    sudo systemctl start docker
elif snap list docker &> /dev/null; then
    log "Docker installed via snap (note: may have permission issues with /opt)"
else
    warn "Could not detect docker service"
fi

#############################################
# Clone or update repository
#############################################

if [ -d "$APP_DIR" ]; then
    log "App directory exists, pulling latest..."
    cd "$APP_DIR"
    git pull
else
    log "Cloning repository..."
    sudo git clone "$REPO_URL" "$APP_DIR"
    sudo chown -R "$USER:$USER" "$APP_DIR"
    cd "$APP_DIR"
fi

#############################################
# Handle dev override file (must be before creating prod override)
#############################################

DEV_OVERRIDE="$APP_DIR/docker-compose.override.yml"
if [ -f "$DEV_OVERRIDE" ] && grep -q "pnpm\|target: base" "$DEV_OVERRIDE"; then
    log "Moving dev override file aside for production..."
    mv "$DEV_OVERRIDE" "$DEV_OVERRIDE.dev"
fi

#############################################
# Generate secrets and create .env
#############################################

ENV_FILE="$APP_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    log "Environment file exists, keeping existing config"
else
    log "Creating environment file with secure secrets..."

    DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    SESSION_SECRET=$(openssl rand -base64 48)

    cat > "$ENV_FILE" << EOF
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/pocket_ideas?schema=public
SESSION_SECRET=${SESSION_SECRET}
EOF

    chmod 600 "$ENV_FILE"
    log "Generated secure passwords in $ENV_FILE"
fi

#############################################
# Create production docker-compose override
#############################################

COMPOSE_OVERRIDE="$APP_DIR/docker-compose.override.yml"

if [ -f "$COMPOSE_OVERRIDE" ]; then
    log "Docker compose override exists, keeping existing config"
else
    log "Creating production docker-compose override..."

    # Extract DB password from .env
    DB_PASSWORD=$(grep DATABASE_URL "$ENV_FILE" | sed 's/.*postgres:\([^@]*\)@.*/\1/')

    cat > "$COMPOSE_OVERRIDE" << EOF
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  app:
    env_file:
      - .env
    restart: unless-stopped
EOF
fi

#############################################
# Build and start containers
#############################################

log "Building and starting containers..."
cd "$APP_DIR"

# Determine docker command (with or without sudo)
DOCKER_CMD="docker"
if ! docker info &> /dev/null; then
    warn "Docker permission issue. Using sudo..."
    DOCKER_CMD="sudo docker"
fi

$DOCKER_CMD compose pull
$DOCKER_CMD compose build
$DOCKER_CMD compose up -d

# Wait for DB to be healthy
log "Waiting for database to be ready..."
sleep 8

#############################################
# Run database migrations
#############################################

log "Running database migrations..."
# Use docker compose run with entrypoint override and pass DATABASE_URL from .env
DB_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
$DOCKER_CMD compose run --rm --entrypoint "" -e DATABASE_URL="$DB_URL" app sh -c "npx prisma migrate deploy --schema=./prisma/schema.prisma"

log "Application running on port 3000"

#############################################
# Install and configure Nginx
#############################################

if command -v nginx &> /dev/null; then
    log "Nginx already installed"
else
    log "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

NGINX_CONF="/etc/nginx/sites-available/idea-vault"

log "Configuring Nginx for $DOMAIN..."
sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
if [ ! -L /etc/nginx/sites-enabled/idea-vault ]; then
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

log "Nginx configured"

#############################################
# Install SSL certificate
#############################################

if command -v certbot &> /dev/null; then
    log "Certbot already installed"
else
    log "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Check if cert already exists
if sudo certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
    log "SSL certificate already exists for $DOMAIN"
else
    log "Obtaining SSL certificate..."
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || {
        warn "Certbot failed. Make sure DNS for $DOMAIN points to this server."
        warn "Run manually: sudo certbot --nginx -d $DOMAIN"
    }
fi

#############################################
# Done!
#############################################

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Installation complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  App URL:     https://${DOMAIN}"
echo "  App Dir:     ${APP_DIR}"
echo "  Env File:    ${ENV_FILE}"
echo ""
echo "  Useful commands:"
echo "    cd ${APP_DIR}"
echo "    docker compose logs -f        # View logs"
echo "    docker compose restart app    # Restart app"
echo "    docker compose down           # Stop all"
echo "    docker compose up -d          # Start all"
echo ""
