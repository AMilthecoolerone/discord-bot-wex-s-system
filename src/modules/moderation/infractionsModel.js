import mongoose from 'mongoose';
import { jsonInfractions } from '../../storage/index.js';
import { config } from '../../config/index.js';

const InfractionSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  moderatorId: String,
  action: String,
  reason: String,
  durationMs: Number,
  createdAt: { type: Date, default: Date.now }
});

export const InfractionModel = mongoose.models.Infraction || mongoose.model('Infraction', InfractionSchema);

export async function addInfraction(doc) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await InfractionModel.create(doc);
  } else {
    await jsonInfractions.load();
    jsonInfractions.data.push({ ...doc, createdAt: new Date().toISOString() });
    await jsonInfractions.save();
    return doc;
  }
}

export async function getInfractions(guildId, userId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await InfractionModel.find({ guildId, userId }).sort({ createdAt: -1 }).lean();
  } else {
    await jsonInfractions.load();
    return jsonInfractions.data.filter(d => d.guildId === guildId && d.userId === userId).sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  }
}
