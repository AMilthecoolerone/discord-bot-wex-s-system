import mongoose from 'mongoose';
import { config } from '../../config/index.js';
import { jsonBuilderApplications } from '../../storage/index.js';
import { logger } from '../../utils/logger.js';

// MongoDB Schema
const BuilderApplicationSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  applicationId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'auto_rejected', 'approved', 'denied'], default: 'pending', index: true },
  answers: { type: Map, of: String, default: new Map() },
  autoRejected: { type: Boolean, default: false },
  rejectionReason: String,
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: String,
  reviewedAt: Date,
  reviewReason: String,
}, { timestamps: true });

export const BuilderApplicationModel = mongoose.models.BuilderApplication || mongoose.model('BuilderApplication', BuilderApplicationSchema);

// Find active (pending) application by user
export async function findActiveApplicationByUser(guildId, userId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await BuilderApplicationModel.findOne({
      guildId,
      userId,
      status: 'pending'
    });
  } else {
    await jsonBuilderApplications.load();
    return jsonBuilderApplications.data.find(
      app => app.guildId === guildId && 
             app.userId === userId && 
             app.status === 'pending'
    );
  }
}

// Find all applications by status
export async function findApplicationsByStatus(guildId, status) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await BuilderApplicationModel.find({ guildId, status }).sort({ submittedAt: -1 });
  } else {
    await jsonBuilderApplications.load();
    return jsonBuilderApplications.data
      .filter(app => app.guildId === guildId && app.status === status)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }
}

// Find application by ID
export async function findApplicationById(guildId, applicationId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await BuilderApplicationModel.findOne({ guildId, applicationId });
  } else {
    await jsonBuilderApplications.load();
    return jsonBuilderApplications.data.find(
      app => app.guildId === guildId && app.applicationId === applicationId
    );
  }
}

// Find application by user (any status)
export async function findApplicationByUser(guildId, userId) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    return await BuilderApplicationModel.findOne({ guildId, userId }).sort({ submittedAt: -1 });
  } else {
    await jsonBuilderApplications.load();
    const apps = jsonBuilderApplications.data.filter(
      app => app.guildId === guildId && app.userId === userId
    );
    return apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] || null;
  }
}

// Generate unique application ID
function generateApplicationId() {
  return `BA-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

// Create application
export async function createBuilderApplication(data) {
  const appData = {
    guildId: data.guildId,
    userId: data.userId,
    applicationId: data.applicationId || generateApplicationId(),
    status: data.status || 'pending',
    answers: data.answers || new Map(),
    autoRejected: data.autoRejected || false,
    rejectionReason: data.rejectionReason,
    submittedAt: data.submittedAt || new Date(),
  };

  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    // Convert Map to object for MongoDB
    const mongoData = { ...appData };
    if (appData.answers instanceof Map) {
      mongoData.answers = Object.fromEntries(appData.answers);
    }
    return await BuilderApplicationModel.create(mongoData);
  } else {
    await jsonBuilderApplications.load();
    // Convert Map to object for JSON
    const jsonData = { ...appData };
    if (jsonData.answers instanceof Map) {
      jsonData.answers = Object.fromEntries(jsonData.answers);
    }
    jsonBuilderApplications.data.push(jsonData);
    await jsonBuilderApplications.save();
    return jsonData;
  }
}

// Update application
export async function updateBuilderApplication(query, update) {
  if (config.storageBackend === 'mongodb' && mongoose.connection.readyState === 1) {
    // Convert Map to object if needed
    const mongoUpdate = { ...update };
    if (mongoUpdate.$set) {
      if (mongoUpdate.$set.answers instanceof Map) {
        mongoUpdate.$set.answers = Object.fromEntries(mongoUpdate.$set.answers);
      }
    }
    return await BuilderApplicationModel.updateOne(query, mongoUpdate);
  } else {
    await jsonBuilderApplications.load();
    const idx = jsonBuilderApplications.data.findIndex(
      app => app.guildId === query.guildId && app.userId === query.userId
    );
    if (idx === -1) return { matchedCount: 0 };
    
    const updateData = update.$set || update;
    if (updateData.answers instanceof Map) {
      updateData.answers = Object.fromEntries(updateData.answers);
    }
    jsonBuilderApplications.data[idx] = { ...jsonBuilderApplications.data[idx], ...updateData };
    await jsonBuilderApplications.save();
    return { matchedCount: 1 };
  }
}