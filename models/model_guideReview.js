import mongoose from 'mongoose';
import { Guide } from './model_guides.js';

const guideReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Rating tidak boleh kosong'],
    },
    message: {
      type: String,
      trim: true,
    },
    guide: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review harus terkait ke guide'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review harus terkait ke user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review harus terkait ke Tour'],
    },
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
      required: [true, 'Review harus terkait ke Booking'],
    },
    ratingType: {
      type: String,
      enum: ['nice', 'bad'],
      required: [true, 'type still empty'],
    },
  },
  { timestamps: true },
);

guideReviewSchema.statics.calcAvgRating = async function (guideId) {
  const statsRating = await this.aggregate([
    {
      $match: { guide: guideId },
    },
    {
      $group: {
        _id: '$guide',
        numRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const newRatingObj = statsRating[0];
  const newRatingTour = {
    ratingsAverage: newRatingObj?.avgRating,
    ratingsQuantity: newRatingObj?.numRating,
  };

  if (newRatingObj)
    await Guide.findOneAndUpdate({ guides: guideId }, newRatingTour);
  else
    await Guide.findOneAndUpdate(
      { guides: guideId },
      { ratingsAverage: 0, ratingsQuantity: 0 },
    );
};

guideReviewSchema.post('save', async function () {
  this.constructor.calcAvgRating(this.guide);
});

guideReviewSchema.post(/^findOneAnd/, async function (doc) {
  doc.constructor.calcAvgRating(doc.guide);
});

export const guideReview = mongoose.model('guideReview', guideReviewSchema);
