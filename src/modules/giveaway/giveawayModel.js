import mongoose from 'mongoose';
import { config } from '../../config/index.js';
import { jsonGiveaways } from '../../storage/index.js';
import { logger } from '../../utils/logger.js';

// MongoDB Schema
const GiveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  prize: { type: String, required: true },
  winnerCount: { type: Number, default: 1 },
  endTime: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  participants: { type: [String], default: [] },
  ended: { type: Boolean, default: false },
  winners: { type: [String], default: [] },
  requiredRole: String,
  minAccountAge: Number, // in days
}, { timestamps: true });

export const GiveawayModel = mongoose.models.Giveaway || mongoose.model('Giveaway', GiveawaySchema);

// Find active giveaway by message ID
export async function findGiveawayByMessage(guildId, messageId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await GiveawayModel.findOne({ guildId, messageId, ended: false });
  } else {
    await jsonGiveaways.load();
    return jsonGiveaways.data.find(
      g => g.guildId === guildId && g.messageId === messageId && !g.ended
    );
  }
}

// Find all active giveaways
export async function findActiveGiveaways(guildId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await GiveawayModel.find({ guildId, ended: false }).sort({ endTime: 1 });
  } else {
    await jsonGiveaways.load();
    return jsonGiveaways.data
      .filter(g => g.guildId === guildId && !g.ended)
      .sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
  }
}

// Find all giveaways (including ended)
export async function findAllGiveaways(guildId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await GiveawayModel.find({ guildId }).sort({ createdAt: -1 });
  } else {
    await jsonGiveaways.load();
    return jsonGiveaways.data
      .filter(g => g.guildId === guildId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

// Create giveaway
export async function createGiveaway(data) {
  const giveawayData = {
    guildId: data.guildId,
    channelId: data.channelId,
    messageId: data.messageId,
    prize: data.prize,
    winnerCount: data.winnerCount || 1,
    endTime: data.endTime,
    createdBy: data.createdBy,
    requiredRole: data.requiredRole,
    minAccountAge: data.minAccountAge,
    participants: [],
    ended: false,
    winners: [],
  };

  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await GiveawayModel.create(giveawayData);
  } else {
    await jsonGiveaways.load();
    jsonGiveaways.data.push(giveawayData);
    await jsonGiveaways.save();
    return giveawayData;
  }
}

// Update giveaway
export async function updateGiveaway(query, update) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await GiveawayModel.updateOne(query, update);
  } else {
    await jsonGiveaways.load();
    const idx = jsonGiveaways.data.findIndex(
      g => g.guildId === query.guildId && g.messageId === query.messageId
    );
    if (idx === -1) return { matchedCount: 0 };
    
    const updateData = update.$set || update;
    jsonGiveaways.data[idx] = { ...jsonGiveaways.data[idx], ...updateData };
    await jsonGiveaways.save();
    return { matchedCount: 1 };
  }
}

// Delete giveaway
export async function deleteGiveaway(guildId, messageId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await GiveawayModel.deleteOne({ guildId, messageId });
  } else {
    await jsonGiveaways.load();
    const idx = jsonGiveaways.data.findIndex(
      g => g.guildId === guildId && g.messageId === messageId
    );
    if (idx === -1) return { deletedCount: 0 };
    jsonGiveaways.data.splice(idx, 1);
    await jsonGiveaways.save();
    return { deletedCount: 1 };
  }
}

// Get expired giveaways (for cleanup)
export async function getExpiredGiveaways() {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await GiveawayModel.find({ 
      ended: false, 
      endTime: { $lte: new Date() } 
    });
  } else {
    await jsonGiveaways.load();
    const now = new Date();
    return jsonGiveaways.data.filter(
      g => !g.ended && new Date(g.endTime) <= now
    );
  }
}