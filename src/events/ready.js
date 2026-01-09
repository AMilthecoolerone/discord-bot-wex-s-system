import { logger } from '../utils/logger.js';
import { loadActiveGiveaways } from '../modules/giveaway/giveawayHandlers.js';

export default {
  name: 'clientReady',
  once: true,
  async execute(client) {
    logger.info(`Ready as ${client.user.tag}`);
    
    // Wait a bit for all guilds to be cached
    setTimeout(async () => {
      // Load and schedule active giveaways
      await loadActiveGiveaways(client);
    }, 2000);
  }
};
