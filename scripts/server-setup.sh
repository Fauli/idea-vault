#!/bin/bash
# Server setup script for Pocket Ideas
# Run as root on a fresh Ubuntu 24.04 server
#
# Usage: curl -fsSL https://raw.githubusercontent.com/YOUR_USER/idea-vault/main/scripts/server-setup.sh | bash

set -e

echo "=== Pocket Ideas Server Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Update system
echo "[1/6] Updating system..."
apt update && apt upgrade -y

# Create deploy user
echo "[2/6] Creating deploy user..."
if ! id "deploy" &>/dev/null; then
  adduser --disabled-password --gecos "" deploy
  usermod -aG sudo deploy
  echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

  # Copy SSH keys from root
  mkdir -p /home/deploy/.ssh
  cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
  echo "  Created user 'deploy'"
else
  echo "  User 'deploy' already exists"
fi

# Configure firewall
echo "[3/6] Configuring firewall..."
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "  Firewall configured (SSH, HTTP, HTTPS allowed)"

# Disable password authentication
echo "[4/6] Securing SSH..."
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
echo "  Password authentication disabled"

# Install Docker
echo "[5/6] Installing Docker..."
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker deploy
echo "  Docker installed: $(docker --version)"

# Install certbot
echo "[6/6] Installing Certbot..."
apt install -y certbot
echo "  Certbot installed"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Log out and SSH as 'deploy' user:"
echo "   ssh deploy@$(hostname -I | awk '{print $1}')"
echo ""
echo "2. Clone your repository:"
echo "   git clone https://github.com/YOUR_USER/idea-vault.git"
echo ""
echo "3. Follow the deployment guide:"
echo "   cat idea-vault/docs/DEPLOYMENT.md"
echo ""
