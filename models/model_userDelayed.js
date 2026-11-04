import mongoose from 'mongoose';
import validator from 'validator';
const userDelayedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'user must have a name'],
    unique: true,
    minlength: [5, 'user name min 5 charackter'],
    maxlength: [20, 'user name max 20 charackter'],
  },

  email: {
    type: String,
    required: [true, 'user must have a email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'please send correct email format',
    },
  },

  countSendOtp: Number,
  countSendEmail: Number,

  blockedSendOtp: Date,
  blockedSendEmail: Date,

  otp: String,
  otpExpired: Date,
});

export const UserDelayed = mongoose.model('userDelayed', userDelayedSchema);
