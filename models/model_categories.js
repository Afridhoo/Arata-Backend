import mongoose from 'mongoose';

const categoriesSchema = new mongoose.Schema({
  categoriesTour: { type: String, required: [true, 'Categories Empty'] },
  description: {
    type: String,
    required: [true, 'Description For Categories Empty'],
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status Exactly active or inactive',
      default: 'active',
    },
  },

  typeCategories: {
    type: String,
    enum: {
      values: ['destination', 'hotel'],
      message: 'typeCategories Exactly destination or hotel',
    },
  },
});

export const CategoriesTour = mongoose.model('categoriTour', categoriesSchema);
