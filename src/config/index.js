import dotenv from 'dotenv';
dotenv.config();

export const config = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  mongoUri: process.env.MONGODB_URI,
  storageBackend: (process.env.STORAGE_BACKEND || 'mongodb').toLowerCase(),
  embedColor: process.env.EMBED_COLOR || '#5865F2',
  modlogChannel: process.env.MODLOG_CHANNEL || 'mod-log',
  staffRole: process.env.STAFF_ROLE || 'Staff',
  ticketCategory: process.env.TICKET_CATEGORY || 'Tickets',
  maxTicketsPerUser: parseInt(process.env.MAX_TICKETS_PER_USER || '1', 10),
  commandScope: (process.env.COMMAND_SCOPE || 'guild').toLowerCase(),
  imageUrl: process.env.IMAGE_URL || '',
};
