import mongoose from 'mongoose';
import validator from 'validator';
import bycrpt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
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

  telphone: {
    type: String,

    validate: {
      validator: validator.isMobilePhone,
      message: 'please send correct phone',
    },
  },
  isEmailVerified: Boolean,
  googleId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

  password: {
    type: String,

    required: function () {
      return this.authProvider === 'local';
    },
    minlength: [6, 'password need 6 charackter'],
    select: false,
  },
  photo: {
    type: String,
  },
  isActiveTrip: {
    type: Boolean,
    default: false,
  },
  confirmPassword: {
    type: String,
    required: function () {
      return this.authProvider === 'local';
    },
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Cheking Password Again',
    },
  },
  createAt: { type: Date, default: Date.now },
  passwordChangedAt: { type: Date, select: false },
  resetPasswordToken: { type: String },
  resetPasswordTokenExpired: { type: Date },
  loginAttempts: { type: Number, default: 0, select: false },
  blockPasswordLogin: { type: Date },
  active: { type: Boolean, default: true },
  role: {
    type: String,
    default: 'user',
  },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bycrpt.hash(this.password, 12);
  this.confirmPassword = undefined;
});

userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bycrpt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWT_TimeStamp) {
  if (this.passwordChangedAt) {
    const time = this.passwordChangedAt.getTime() / 1000;

    return JWT_TimeStamp < time;
  }
  return false;
};

userSchema.methods.tokenResetPassword = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.resetPasswordTokenExpired = Date.now() + 10 * 60 * 1000;
};

export const User = mongoose.model('User', userSchema);
