# Quick Start

1. Create your bot in the Discord Developer Portal and copy TOKEN and CLIENT_ID.
2. Invite the bot with appropriate scopes: `bot` and `applications.commands`; permissions including Manage Channels, Manage Roles, Kick/Ban, Moderate Members.
3. Clone/upload this project to your host.
4. `npm install` then copy `.env.example` to `.env` and fill in values.
5. `npm run register` (guild scope by default) then `npm run start`.
6. In your server:
   - Create a `Tickets` category (or set your preferred name in `.env`).
   - Create a #mod-log text channel (or run `/setlogchannel` to set an existing one).
   - Ensure your staff role name matches `STAFF_ROLE`.
7. Test commands:
   - Moderation: `/warn`, `/ban`, `/timeout`, etc.
   - Tickets: `/ticket-panel` then press Open Ticket and submit the modal.
   - Vouch: `/vouch @staff rating 5 comment "Great support!"` and `/vouches @staff`.
