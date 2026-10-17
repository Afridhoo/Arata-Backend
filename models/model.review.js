import mongoose from 'mongoose';
import { Tour } from './model_tour.js';

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
      required: [true, 'booking still empty'],
    },
    message: {
      type: String,
      trim: true,
      required: [true, 'review still empty'],
    },
    rating: {
      type: Number,
      required: [true, 'rating still empty'],
      min: [1, 'min rating 1'],
      max: [5, 'max rating 5'],
    },
    createdAt: { type: Date, default: Date.now() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'tour still empty'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'user still empty'],
    },
    ratingType: {
      type: String,
      enum: ['nice', 'bad'],
      required: [true, 'type still empty'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.statics.calcAvgRating = async function (tourId) {
  const statsRating = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
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

  if (newRatingObj) await Tour.findByIdAndUpdate(tourId, newRatingTour);
  else
    await await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
};

reviewSchema.post('save', async function () {
  this.constructor.calcAvgRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  doc.constructor.calcAvgRating(doc.tour);
});
export const Review = mongoose.model('Review', reviewSchema);
