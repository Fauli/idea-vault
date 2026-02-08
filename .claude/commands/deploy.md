# Deploy to Production

Deploy the Pocket Ideas app to the Hetzner VM at faulis.ch.

## Server Details
- **Host**: root@faulis.ch
- **App Directory**: /opt/idea-vault
- **Domain**: https://faulis.ch

## Deployment Steps

Execute these steps in order:

### 1. SSH and pull latest code
```bash
ssh root@faulis.ch "cd /opt/idea-vault && git pull"
```

### 2. Rebuild the app container
```bash
ssh root@faulis.ch "cd /opt/idea-vault && docker compose build app"
```

### 3. Restart containers
```bash
ssh root@faulis.ch "cd /opt/idea-vault && docker compose up -d"
```

### 4. Run database migrations (if any)
```bash
ssh root@faulis.ch "cd /opt/idea-vault && source .env && docker compose run --rm --entrypoint '' -e DATABASE_URL=\"\$DATABASE_URL\" app sh -c 'cat > /tmp/prisma.config.js << EOF
module.exports = {
  schema: \"/app/prisma/schema.prisma\",
  datasource: { url: process.env.DATABASE_URL },
}
EOF
npx prisma migrate deploy --config=/tmp/prisma.config.js'"
```

### 5. Verify deployment
```bash
ssh root@faulis.ch "docker compose -f /opt/idea-vault/docker-compose.yml logs app --tail 5"
curl -sI https://faulis.ch | head -5
```

## Rollback (if needed) but try forward fixing first
If something goes wrong:
```bash
ssh root@faulis.ch "cd /opt/idea-vault && git checkout HEAD~1 && docker compose build app && docker compose up -d"
```

## Your Task
Execute the deployment steps above. Report success or any errors encountered.

$ARGUMENTS
