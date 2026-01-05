import mongoose from 'mongoose';
import { JsonCollection } from '../../storage/jsonAdapter.js';
import { config } from '../../config/index.js';

const VouchSchema = new mongoose.Schema({
  guildId: { type: String, index: true },
  staffId: { type: String, index: true },
  voterId: { type: String, index: true },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const VouchModel = mongoose.models.Vouch || mongoose.model('Vouch', VouchSchema);
const jsonVouches = new JsonCollection('vouches');

async function useMongo() {
  try { return config.storageBackend === 'mongodb' && (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2); } catch { return false; }
}

// Append-only create: every /vouch call becomes a new entry (no upsert)
export async function createVouch({ guildId, staffId, voterId, rating, comment }) {
  if (await useMongo()) {
    return await VouchModel.create({ guildId, staffId, voterId, rating, comment });
  } else {
    await jsonVouches.load();
    const entry = { guildId, staffId, voterId, rating, comment, updatedAt: new Date().toISOString() };
    jsonVouches.data.push(entry);
    await jsonVouches.save();
    return entry;
  }
}

export async function listVouchesForStaff(guildId, staffId, limit = 20) {
  if (await useMongo()) {
    return await VouchModel.find({ guildId, staffId }).sort({ updatedAt: -1 }).limit(limit).lean();
  } else {
    await jsonVouches.load();
    return jsonVouches.data.filter(v => v.guildId === guildId && v.staffId === staffId)
      .sort((a,b)=> new Date(b.updatedAt)-new Date(a.updatedAt))
      .slice(0, limit);
  }
}

export async function aggregateLeaderboard(guildId, minCount = 3) {
  if (await useMongo()) {
    const rows = await VouchModel.aggregate([
      { $match: { guildId } },
      { $group: { _id: '$staffId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $match: { count: { $gte: minCount } } },
      { $sort: { avgRating: -1, count: -1 } },
      { $limit: 15 }
    ]);
    return rows.map(r => ({ staffId: r._id, avgRating: r.avgRating, count: r.count }));
  } else {
    await jsonVouches.load();
    const byStaff = {};
    for (const v of jsonVouches.data.filter(v => v.guildId === guildId)) {
      byStaff[v.staffId] = byStaff[v.staffId] || { total: 0, count: 0 };
      byStaff[v.staffId].total += v.rating;
      byStaff[v.staffId].count += 1;
    }
    return Object.entries(byStaff)
      .map(([staffId, { total, count }]) => ({ staffId, avgRating: total / count, count }))
      .filter(x => x.count >= minCount)
      .sort((a,b)=> b.avgRating - a.avgRating || b.count - a.count)
      .slice(0, 15);
  }
}
