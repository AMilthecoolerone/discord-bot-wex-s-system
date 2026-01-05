import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { JsonCollection } from './jsonAdapter.js';

export async function initStorage() {
  if (config.storageBackend === 'mongodb') {
    if (!config.mongoUri) {
      logger.warn('MONGODB_URI not set; falling back to JSON storage.');
      return { backend: 'json' };
    }
    try {
      await mongoose.connect(config.mongoUri);
      logger.info('Connected to MongoDB');
      return { backend: 'mongodb' };
    } catch (e) {
      logger.error('MongoDB connection failed, using JSON storage.', e);
      return { backend: 'json' };
    }
  }
  return { backend: 'json' };
}

// JSON collections
export const jsonInfractions = new JsonCollection('infractions');
export const jsonSettings = new JsonCollection('settings');
