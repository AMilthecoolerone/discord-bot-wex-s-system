import { logger } from '../utils/logger.js';

export default {
  name: 'clientReady',
  once: true,
  async execute(client) {
    logger.info(`Ready as ${client.user.tag}`);
  }
};
