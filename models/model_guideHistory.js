import mongoose from 'mongoose';
import { Guide } from './model_guides.js';

const guideHistory = new mongoose.Schema({
  guide: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  tour: { type: mongoose.Schema.ObjectId, ref: 'Tour' },
  destination: { type: mongoose.Schema.ObjectId, required: true },
  completedAt: { type: Date, default: Date.now },
});

guideHistory.statics.calcFinishDestination = async function (guideId) {
  const totalHandle = await this.countDocuments({ guide: guideId });

  await Guide.findOneAndUpdate(
    { guides: guideId },
    { finishedHandle: totalHandle },
  );
};

guideHistory.post('save', async function () {
  this.constructor.calcFinishDestination(this.guide);
});

guideHistory.post(/^findOneAnd/, async function (doc) {
  doc.constructor.calcFinishDestination(doc.guide);
});

export const GuideHistory = mongoose.model('guideHistory', guideHistory);
