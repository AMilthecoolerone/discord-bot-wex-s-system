import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './loader/commands.js';
import { loadEvents } from './loader/events.js';
import { initStorage } from './storage/index.js';
import { resumeGiveaways } from './utils/giveawayScheduler.js';

// Ensure global embed color (GREEN) exists — safe, no side effects
config.embedColor ??= 0x2ECC71;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.GuildMember,
    Partials.Message,
    Partials.Channel
  ]
});

client.commands = new Collection();

// Load systems
await loadCommands(client);
await loadEvents(client);

// Init storage
const storage = await initStorage();
logger.info(`Storage backend: ${storage.backend}`);

if (!config.token) {
  logger.error('TOKEN missing in environment.');
  process.exit(1);
}

// Login
client
  .login(config.token)
  .then(async () => {
    logger.info('Bot logged in.');

    // Resume giveaways after login (restart-safe)
    await resumeGiveaways(client);
  })
  .catch(err => {
    logger.error('Login failed', err);
    process.exit(1);
  });
