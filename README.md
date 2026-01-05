# Katapump Moderation Bot (discord.js v14)

Features:
- Vouch system: members can vouch for staff (role 'Staff'); /vouch, /vouches, /vouch-leaderboard; one vouch per voter per staff with updates; mod-log for submissions.
- Moderation commands: ban, kick, timeout (mute), unmute, warn, purge, slowmode, nick, lock, unlock, setlogchannel, infractions; with mod-log.
- Full scaffold for moderation, tickets, and vouches (modules to be implemented in subsequent steps)
- Slash-command loader and registration script
- Configurable via .env and config file
- JSON storage fallback alongside MongoDB
- Ready for self-host with PM2 or Docker

## Setup
1. Copy `.env.example` to `.env` and fill in TOKEN, CLIENT_ID, GUILD_ID, etc.
2. Install deps: `npm install`
3. Register slash commands: `npm run register`
4. Run the bot: `npm run start`

## Config
See `.env.example` and `src/config/index.js`.

## Contents
- src/commands: Slash command implementations (moderation, ticket, vouch)
- src/events: Event handlers (ready, interactionCreate, messageCreate)
- src/modules: Feature modules (moderation infractions, tickets, vouch)
- src/utils: Logger, modlog, settings helpers
- src/config: Config loader from environment
- src/storage: Storage adapters (MongoDB via mongoose, JSON fallback)

## Troubleshooting
- Commands not appearing: ensure `npm run register` succeeds and that TOKEN/CLIENT_ID/GUILD_ID are correct; for global scope, allow up to 1 hour propagation.
- MongoDB errors: validate `MONGODB_URI`; if unavailable, set `STORAGE_BACKEND=json`.
- Ticket channels not created: verify the category exists and bot has Manage Channels permission.
- Mod-log not logging: create a text channel and run `/setlogchannel`.

## Panel Image Configuration
Set IMAGE_URL in your .env to a public image link (Discord CDN or other). Example:

IMAGE_URL=https://cdn.discordapp.com/attachments/.../your_image.png

The /ticket-dropdown-panel embed will display this image.
You can also override per-panel by running:
```
/ticket-dropdown-panel image_url:https://your-public-image-link
```

## Vouch System (Multiple Entries)
Each `/vouch` call now creates a new vouch entry (no overwrite). `/vouches` shows recent entries (default 20, up to 50). The leaderboard averages across all entries.
