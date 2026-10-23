import mongoose from 'mongoose';

const documentationSchema = new mongoose.Schema({
  tour: { type: mongoose.Schema.ObjectId, ref: 'Tour' },
  guide: [{ type: mongoose.Schema.ObjectId, ref: 'Guide' }],
  userBookingId: [{ type: mongoose.Schema.ObjectId }],
  userBooking: [
    {
      userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
      totalUserCompleted: Number,
      totalUserIncompleted: Number,
      statusUserBooking: {
        type: String,
        enum: ['pending', 'incompleted', 'completed'],
      },
    },
  ],

  statusDocumentation: {
    type: String,
    enum: ['ongoing', 'finished'],
  },

  trip: [
    {
      assigned_at: Date,
      completed_at: Date,
      destination: mongoose.Schema.ObjectId,
      note: String,
      destinationLocation: [Number],
      groupLocation: [Number],
      images: [String],
      statusHandle: String,
      uploadAt: {
        type: Date,
        default: Date.now(),
      },
      guideIdentityUpload: mongoose.Schema.ObjectId,
    },
  ],
  startDate: Date,
  finishedDate: Date,
});

export const Documentation = mongoose.model(
  'documentation',
  documentationSchema,
);
