import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    tour: { type: mongoose.Schema.ObjectId, ref: 'Tour', },
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    quantity: Number,
  },
  { timestamps: true },
);

export const Favorite = mongoose.model('favorite', favoriteSchema);
