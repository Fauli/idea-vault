# Deployment Guide - Hetzner VM

This guide covers deploying Pocket Ideas to a Hetzner Cloud VM.

## Prerequisites

- Hetzner Cloud account
- Domain name pointing to your server (for SSL)
- SSH key pair

---

## 1. Provision the VM

### Via Hetzner Cloud Console

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Create new project (or use existing)
3. Add Server:
   - **Location**: Choose nearest (e.g., Nuremberg, Helsinki)
   - **Image**: Ubuntu 24.04 LTS
   - **Type**: CX22 (2 vCPU, 4GB RAM) - minimum recommended
   - **SSH Key**: Add your public key
   - **Name**: `pocket-ideas`

### Via CLI (hcloud)

```bash
# Install hcloud CLI
brew install hcloud  # macOS

# Configure
hcloud context create pocket-ideas

# Create server
hcloud server create \
  --name pocket-ideas \
  --type cx22 \
  --image ubuntu-24.04 \
  --location nbg1 \
  --ssh-key your-key-name
```

---

## 2. Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

### Update system

```bash
apt update && apt upgrade -y
```

### Create deploy user

```bash
# Create user
adduser --disabled-password --gecos "" deploy

# Add to sudo group
usermod -aG sudo deploy

# Allow sudo without password (for deploy scripts)
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

# Copy SSH keys
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Configure firewall (UFW)

```bash
# Install UFW
apt install -y ufw

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Disable password authentication

```bash
# Edit SSH config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Disable root login (optional, after confirming deploy user works)
# sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Restart SSH
systemctl restart sshd
```

---

## 3. Install Docker

```bash
# Install prerequisites
apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add deploy user to docker group
usermod -aG docker deploy

# Verify installation
docker --version
docker compose version
```

---

## 4. Deploy Application

Switch to deploy user:

```bash
su - deploy
```

### Clone repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/idea-vault.git
cd idea-vault
```

### Configure environment

```bash
# Copy example env file
cp .env.prod.example .env.prod

# Edit with your values
nano .env.prod
```

Required values:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<generate-secure-password>
POSTGRES_DB=pocket_ideas
SESSION_SECRET=<generate-with: openssl rand -base64 32>
DOMAIN=ideas.yourdomain.com
```

### Create SSL directory

```bash
mkdir -p docker/ssl
```

### Generate temporary self-signed cert (for initial nginx startup)

```bash
openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
  -keyout docker/ssl/privkey.pem \
  -out docker/ssl/fullchain.pem \
  -subj "/CN=localhost"
```

### Start the stack

```bash
# Load environment
set -a; source .env.prod; set +a

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Run database migrations

From your **local machine** (with SSH tunnel):

```bash
# Open SSH tunnel
ssh -L 5432:localhost:5432 deploy@YOUR_SERVER_IP

# In another terminal, run migrations
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pocket_ideas" \
  npx prisma migrate deploy

# Seed users
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pocket_ideas" \
  SEED_PASSWORD_F=<password1> \
  SEED_PASSWORD_K=<password2> \
  npm run db:seed
```

---

## 5. SSL Certificate (Let's Encrypt)

### Point your domain to the server

Add an A record in your DNS:
```
ideas.yourdomain.com -> YOUR_SERVER_IP
```

Wait for DNS propagation (check with `dig ideas.yourdomain.com`).

### Install Certbot and get certificate

```bash
# Install certbot
apt install -y certbot

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Get certificate
certbot certonly --standalone \
  -d ideas.yourdomain.com \
  --non-interactive \
  --agree-tos \
  --email your@email.com

# Copy certificates
cp /etc/letsencrypt/live/ideas.yourdomain.com/fullchain.pem docker/ssl/
cp /etc/letsencrypt/live/ideas.yourdomain.com/privkey.pem docker/ssl/

# Start nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

### Auto-renewal

```bash
# Test renewal
certbot renew --dry-run

# Add cron job for auto-renewal
crontab -e
```

Add this line:
```
0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/ideas.yourdomain.com/*.pem /home/deploy/idea-vault/docker/ssl/ && docker compose -f /home/deploy/idea-vault/docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 6. Verify Deployment

1. Visit `https://ideas.yourdomain.com`
2. You should see the login page
3. Log in with your seeded credentials
4. Test creating items, uploading images

### Check SSL rating

Visit [SSL Labs](https://www.ssllabs.com/ssltest/) and test your domain.
Target: A+ rating.

---

## 7. Backups

### Create backup script

```bash
mkdir -p ~/backups
cat > ~/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=14

# Database backup
docker compose -f ~/idea-vault/docker-compose.prod.yml exec -T db \
  pg_dump -U postgres pocket_ideas | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Uploads backup
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" \
  -C /var/lib/docker/volumes \
  idea-vault_uploads-data

# Cleanup old backups
find "$BACKUP_DIR" -name "*.gz" -mtime +$KEEP_DAYS -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup.sh
```

### Schedule nightly backups

```bash
crontab -e
```

Add:
```
0 2 * * * /home/deploy/backup.sh >> /home/deploy/backups/backup.log 2>&1
```

### Test backup restore

```bash
# Restore database
gunzip -c ~/backups/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f ~/idea-vault/docker-compose.prod.yml exec -T db \
  psql -U postgres pocket_ideas
```

---

## 8. Monitoring

### Check logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Health check endpoint (optional)

The app responds at `/api/health` (if implemented) or check login page:
```bash
curl -s -o /dev/null -w "%{http_code}" https://ideas.yourdomain.com/login
```

### Set up uptime monitoring

Use a free service like:
- [UptimeRobot](https://uptimerobot.com/)
- [Hetrix Tools](https://hetrixtools.com/)

Monitor: `https://ideas.yourdomain.com/login`

---

## 9. Updates

To deploy updates:

```bash
cd ~/idea-vault

# Pull latest changes
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run any new migrations (from local with SSH tunnel)
# DATABASE_URL="..." npx prisma migrate deploy
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start stack | `docker compose -f docker-compose.prod.yml up -d` |
| Stop stack | `docker compose -f docker-compose.prod.yml down` |
| View logs | `docker compose -f docker-compose.prod.yml logs -f` |
| Restart app | `docker compose -f docker-compose.prod.yml restart app` |
| Rebuild app | `docker compose -f docker-compose.prod.yml up -d --build app` |
| DB shell | `docker compose -f docker-compose.prod.yml exec db psql -U postgres pocket_ideas` |
| Backup now | `~/backup.sh` |

---

## Troubleshooting

### App not starting
```bash
docker compose -f docker-compose.prod.yml logs app
```

### Database connection issues
```bash
# Check db is healthy
docker compose -f docker-compose.prod.yml ps db

# Check connectivity
docker compose -f docker-compose.prod.yml exec app nc -zv db 5432
```

### SSL certificate issues
```bash
# Check certificate
openssl s_client -connect ideas.yourdomain.com:443 -servername ideas.yourdomain.com

# Renew manually
certbot renew --force-renewal
```

### Out of disk space
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a
```
