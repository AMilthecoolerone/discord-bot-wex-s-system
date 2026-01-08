import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible .env file locations
const possiblePaths = [
  resolve(__dirname, '../../.env'),           // From src/config/ -> project root
  resolve(process.cwd(), '.env'),             // Current working directory
  resolve(__dirname, '../../../.env'),         // One level up (if running from different location)
];

let envLoaded = false;
let loadedPath = null;
for (const envPath of possiblePaths) {
  if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      envLoaded = true;
      loadedPath = envPath;
      break;
    }
  }
}

// Fallback: try default dotenv behavior (current directory)
if (!envLoaded) {
  const result = dotenv.config();
  if (!result.error && result.parsed) {
    envLoaded = true;
    loadedPath = 'default (process.cwd)';
  }
}

// Debug: Log which .env was loaded (only if TOKEN is missing, to help troubleshoot)
if (!process.env.TOKEN && loadedPath) {
  console.warn(`[Config] Loaded .env from: ${loadedPath}, but TOKEN is still missing`);
} else if (!process.env.TOKEN) {
  console.warn(`[Config] No .env file found in any of the checked locations. Checked:`, possiblePaths);
}

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
  builderReviewChannel: process.env.BUILDER_REVIEW_CHANNEL || 'builder-applications',
};