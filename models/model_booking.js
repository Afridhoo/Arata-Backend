import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
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
    totalPrice: {
      type: Number,
    },
    quantity: {
      type: Number,
      required: [true, 'quantity still empty'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'finished', 'cancelled'],
      default: 'pending',
    },

    dateFinished: Date,

    payment: {
      type: String,
      enum: ['Qris'],
      required: [true, 'payment still empty'],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    confirmAt: {
      type: Date,
    },
    order_id: {
      type: String,
    },
    cancelAt: {
      type: Date,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

bookingSchema.virtual('review', {
  ref: 'Review',
  foreignField: 'booking',
  localField: '_id',
});
bookingSchema.virtual('documentation', {
  ref: 'documentation',
  foreignField: 'userBookingId',
  localField: '_id',
});

export const Booking = mongoose.model('Booking', bookingSchema);
