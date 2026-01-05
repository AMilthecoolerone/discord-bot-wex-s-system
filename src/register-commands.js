import { REST, Routes, Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from './config/index.js';
import { loadCommands } from './loader/commands.js';

function maskId(id) {
  if (!id) return 'MISSING';
  const s = String(id);
  return s.length <= 6 ? s : `${s.slice(0,3)}...${s.slice(-3)}`;
}

if (!config.token) {
  console.error('ERROR: TOKEN missing from .env');
  process.exit(1);
}
if (!config.clientId) {
  console.error('ERROR: CLIENT_ID missing from .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(config.token);
await new Promise(r => client.once('clientReady', r).once('ready', r)); // support v14+v15 naming

client.commands = new Collection();
await loadCommands(client);

const commands = Array.from(client.commands.values()).map(c => c.data.toJSON());
console.log(`Registering ${commands.length} command(s):`, Array.from(client.commands.keys()).join(', ') || '(none)');
console.log(`Scope preference: ${config.commandScope || 'guild'} | CLIENT_ID=${maskId(config.clientId)} | GUILD_ID=${maskId(config.guildId)}`);

const rest = new REST({ version: '10' }).setToken(config.token);
try {
  if ((config.commandScope === 'guild' || !config.commandScope) && config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
    console.log('Registered guild commands');
  } else if (config.commandScope === 'global') {
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log('Registered global commands');
  } else {
    if (!config.guildId) {
      console.warn('No GUILD_ID set and COMMAND_SCOPE is not global; defaulting to global registration. This may take up to 1 hour to appear.');
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      console.log('Registered global commands (fallback)');
    } else {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
      console.log('Registered guild commands (fallback)');
    }
  }
} catch (err) {
  console.error('Command registration failed:', err?.message || err);
  process.exit(1);
}
process.exit(0);
