import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { loadCommands } from './loader/commands.js';
import { loadEvents } from './loader/events.js';
import { initStorage } from './storage/index.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.GuildMember, Partials.Message, Partials.Channel]
});

client.commands = new Collection();

await loadCommands(client);
await loadEvents(client);

const storage = await initStorage();
logger.info(`Storage backend: ${storage.backend}`);

if (!config.token) {
  logger.error('TOKEN missing in environment.');
  process.exit(1);
}

client.login(config.token).then(() => logger.info('Bot logged in.')).catch(err => {
  logger.error('Login failed', err);
  process.exit(1);
});
