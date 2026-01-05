import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { jsonSettings } from '../storage/index.js';

const SettingsSchema = new mongoose.Schema({
  guildId: { type: String, index: true },
  modlogChannelId: String,
}, { timestamps: true });

export const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export async function getSettings(guildId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    let s = await SettingsModel.findOne({ guildId });
    if (!s) s = await SettingsModel.create({ guildId });
    return s;
  } else {
    await jsonSettings.load();
    let s = jsonSettings.data.find(d => d.guildId === guildId);
    if (!s) { s = { guildId }; jsonSettings.data.push(s); await jsonSettings.save(); }
    return s;
  }
}

export async function setModlogChannel(guildId, channelId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    await SettingsModel.updateOne({ guildId }, { $set: { modlogChannelId: channelId } }, { upsert: true });
  } else {
    await jsonSettings.load();
    const idx = jsonSettings.data.findIndex(d => d.guildId === guildId);
    if (idx === -1) jsonSettings.data.push({ guildId, modlogChannelId: channelId });
    else jsonSettings.data[idx].modlogChannelId = channelId;
    await jsonSettings.save();
  }
}
