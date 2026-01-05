import mongoose from 'mongoose';
import { JsonCollection } from '../../storage/jsonAdapter.js';
import { config } from '../../config/index.js';

const TicketSchema = new mongoose.Schema({
  category: String, 
  guildId: String,
  userId: String,
  channelId: String,
  type: { type: String, enum: ['normal', 'appeal'], default: 'normal' },
  reason: String,
  claimedBy: String,
  open: { type: Boolean, default: true },
  participants: [String],
  createdAt: { type: Date, default: Date.now },
  closedAt: Date,
});

export const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);

const jsonTickets = new JsonCollection('tickets');

async function useMongo() {
  try {
    // mongoose connection handled globally; check if ready
    return config.storageBackend === 'mongodb' && (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2);
  } catch { return false; }
}

export async function createTicket(doc) {
  if (await useMongo()) {
    return await TicketModel.create(doc);
  } else {
    await jsonTickets.load();
    jsonTickets.data.push({ ...doc, createdAt: new Date().toISOString(), open: true });
    await jsonTickets.save();
    return doc;
  }
}

export async function findOpenTicketsByUser(guildId, userId) {
  if (await useMongo()) {
    return await TicketModel.find({ guildId, userId, open: true }).lean();
  } else {
    await jsonTickets.load();
    return jsonTickets.data.filter(t => t.guildId === guildId && t.userId === userId && t.open);
  }
}

export async function updateTicket(query, update) {
  if (await useMongo()) {
    return await TicketModel.updateOne(query, update);
  } else {
    await jsonTickets.load();
    const idx = jsonTickets.data.findIndex(t => Object.keys(query).every(k => t[k] === query[k]));
    if (idx !== -1) {
      jsonTickets.data[idx] = { ...jsonTickets.data[idx], ...update.$set };
      await jsonTickets.save();
    }
  }
}

export async function findTicketByChannel(guildId, channelId) {
  if (await useMongo()) {
    return await TicketModel.findOne({ guildId, channelId }).lean();
  } else {
    await jsonTickets.load();
    return jsonTickets.data.find(t => t.guildId === guildId && t.channelId === channelId) || null;
  }
}

export async function deleteTicket(query) {
  if (await useMongo()) {
    return await TicketModel.deleteOne(query);
  } else {
    await jsonTickets.load();
    const idx = jsonTickets.data.findIndex(t => Object.keys(query).every(k => t[k] === query[k]));
    if (idx !== -1) {
      jsonTickets.data.splice(idx, 1);
      await jsonTickets.save();
    }
  }
}