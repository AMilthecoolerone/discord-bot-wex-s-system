# Deployment Guide (Self-Hosting)

## Prerequisites
- Node.js 20+ (LTS or latest)
- A machine or VPS (e.g., your Katapump host)
- Discord bot token and application ID

## Install and Run
```bash
npm install
cp .env.example .env
# Fill .env with your values
npm run register   # registers slash commands (requires TOKEN/CLIENT_ID and optionally GUILD_ID)
npm run start      # start the bot
```

## PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 status
pm2 logs katapump-mod-bot
```

## Docker
- The provided Dockerfile builds a minimal image.
```bash
docker build -t katapump-mod-bot .
docker run --env-file .env --name katapump-mod-bot --restart unless-stopped katapump-mod-bot
```
Mount volumes if you use JSON storage:
```bash
docker run -v $(pwd)/data:/app/data --env-file .env --name katapump-mod-bot --restart unless-stopped katapump-mod-bot
```

## Permissions and Intents
- Enable privileged intents (SERVER MEMBERS, MESSAGE CONTENT) in the Discord Developer Portal.
- Ensure the bot has permissions to manage channels and members for moderation and ticket features.
