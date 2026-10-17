import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: [true, 'booking still empty'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'user still empty'],
  },
  message: {
    type: String,
    required: [true, 'message still empty'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  typeNotif: String,
});

export const Notification = mongoose.model('Notification', notificationSchema);
