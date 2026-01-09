# Configuration Guide

This bot is configurable via environment variables in `.env` and defaults in `src/config/index.js`.

Environment variables (.env):
- TOKEN: Discord bot token
- CLIENT_ID: Application client ID
- GUILD_ID: Target guild ID (for guild-only command registration). If empty and COMMAND_SCOPE=global, commands register globally.
- MONGODB_URI: MongoDB connection string (Atlas or self-hosted). If absent or connection fails, bot falls back to JSON storage.
- STORAGE_BACKEND: `mongodb` or `json` (default mongodb)
- EMBED_COLOR: Hex color for embeds (e.g., `#5865F2`)
- MODLOG_CHANNEL: Name of the mod-log channel (used if no explicit ID is set via /setlogchannel)
- STAFF_ROLE: Name of the staff role (default `Staff`)
- TICKET_CATEGORY: Category name where ticket channels are created (default `Tickets`)
- MAX_TICKETS_PER_USER: Limit of open tickets per user (default `1`)
- COMMAND_SCOPE: `guild` or `global` (default `guild`)
- BUILDER_REVIEW_CHANNEL: Name of the builder application review channel (default `builder-applications`)

Notes:
- You can override the mod-log channel by running `/setlogchannel` once; this stores the channel ID in persistent settings.
- You can override the builder review channel by running `/builderapplication setchannel` once; this stores the channel ID in persistent settings.
- Ensure the `Tickets` category exists in your server for the ticket channels. You can change the name via `.env`.
- Ensure the builder review channel exists in your server (or set it via the command).