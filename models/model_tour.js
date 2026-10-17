import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
    },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
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
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          if (!this.price) return true;
          return val < this.price;
        },
        message: 'Discount Must Be Lower Than Price',
      },
    },
    isBooking: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },

    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    isActiveTripTour: {
      type: Boolean,
      default: false,
    },

    categories: {
      type: mongoose.Schema.ObjectId,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      date: {
        from: { type: Date },
        to: { type: Date },
      },
      time: [],
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: {
      destination: [
        {
          date: {
            from: { type: Date },
            to: { type: Date },
          },
          coordinates: [Number],
          address: String,
          description: String,
          categories: mongoose.Schema.ObjectId,
          time: {},
          image: String,
          typeLocation: {
            type: String,
            default: 'destination',
          },
          dateFinished: Date,
          status: {
            type: String,
            default: 'pending',
          },
          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],

      hotel: [
        {
          date: {
            from: { type: Date },
            to: { type: Date },
          },
          time: {},
          coordinates: [Number],
          address: String,
          description: String,
          categories: mongoose.Schema.ObjectId,
          image: String,
          typeLocation: {
            type: String,
            default: 'hotel',
          },
          dateFinished: Date,
          status: {
            type: String,
            default: 'pending',
          },
          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],
    },

    slot: {
      type: Number,
    },
    soldOut: {
      type: Boolean,
      default: false,
    },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.pre('save', async function () {
  if (this.isNew) this.slot = this.maxGroupSize;
});

tourSchema.virtual('review', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.virtual('booking', {
  ref: 'Booking',
  foreignField: 'tour',
  localField: '_id',
});

export const Tour = mongoose.model('Tour', tourSchema);
