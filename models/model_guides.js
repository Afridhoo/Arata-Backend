import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema({
  guides: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
  },

  destinationHandle: [mongoose.Schema.ObjectId],

  dateAssigned: Date,

  statusGuide: {
    type: String,
    enum: ['ready', 'pending', 'ongoing', 'finished', 'cancelled', 'inactive'],
    default: 'ready',
  },

  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: (val) => Math.round(val * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },

  finishedHandle: {
    type: Number,
    default: 0,
  },

  skillGuide: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'categoriTour',
    },
  ],
  assignedAt: Date,
});

export const Guide = mongoose.model('guide', guideSchema);
