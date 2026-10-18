import catchAsync from '../helper/catchAsync.js';
;
import errorApp from '../helper/errorQuery.js';
import { sendToken, sendTokenLogout } from '../helper/tokenHelper.js';
import { User } from '../models/model_user.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { uploadGoogleImg } from '../helper/cloudinary.js';

export const signup = catchAsync(async (req, res, next) => {
  const { name, email, telphone, password, confirmPassword } = req.body;

  const newUser = await User.create({
    name,
    email,
    telphone,
    password,
    confirmPassword,
  });

  sendToken(res, newUser);
});

export const login = catchAsync(async (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return next(
      new errorApp('Please enter your email & password in this form', 400),
    );
  }
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +loginAttempts');
  if (!user) return next(new errorApp('account does not exist.', 404));

  if (user.blockPasswordLogin > Date.now()) {
    return next(new errorApp('Please wait 10 minutes for login again', 400));
  }

  const correctPassword = await user?.correctPassword(password, user.password);
  if (!correctPassword) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= 3) {
      user.blockPasswordLogin = Date.now() + 10 * 60 * 1000;
    }
    await user.save({ validateBeforeSave: false });

    return next(
      new errorApp('Please check your email or password again.', 401),
    );
  }

  user.loginAttempts = undefined;
  user.blockPasswordLogin = undefined;
  await user.save({ validateBeforeSave: false });

  sendToken(res, user);
});

export const logOut = catchAsync(async (req, res, next) => {
  sendTokenLogout(res);
});

export const loginByGoogle = catchAsync(async (req, res, next) => {
  const { credential } = req.body;

  if (!credential)
    return next(new errorApp('Gagal Login Menggunakan Google', 400));

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { sub, email_verified, name, picture, email } = ticket.getPayload();

  if (!email_verified)
    return next(new errorApp(`Email ${name} Belum Terverifikasi`));

  let userData = await User.exists({ googleId: sub });

  if (!userData) {
    const checkEmailIsReady = await User.exists({ email });

    if (checkEmailIsReady) {
      userData = await User.findOneAndUpdate({
        email,
        googleId: sub,
        authProvider: 'local',
      });
    } else {
      userData = await User.create({
        name,
        email,
        googleId: sub,
        authProvider: 'google',
        photo: picture && (await uploadGoogleImg(picture)),
      });
    }
  }

  sendToken(res, userData);
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body?.email;

  const user = await User.findOne({ email });
  if (!user) return next(new errorApp('account does not exist.', 404));

  user.tokenResetPassword();
  user.save({ validateBeforeSave: false });

 


 

  res.status(200).json({
    status: 'sucsess',
    message: 'code reset succsess send in your email',
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const tokenParams = req.params.token;

  const user = await User.findOne({
    resetPasswordToken: tokenParams,
    resetPasswordTokenExpired: {
      $gt: Date.now(),
    },
  });

  if (!user)
    return next(
      new errorApp('code is not avaliable , please request again', 400),
    );

  const { password, confirmPassword } = req.body;
  user.password = password;
  user.confirmPassword = confirmPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpired = undefined;

  await user.save();
  sendToken(res, user);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  const user = await User.findById(middelwareReq._id).select('+password');

  const { password, newPassword, confirmPassword } = req.body;
  const chekingPassword = await user?.correctPassword(password, user.password);

  if (!chekingPassword)
    return next(new errorApp('Passsword Tidak Sesuai'), 401);

  user.password = newPassword;
  user.confirmPassword = confirmPassword;

  await user.save();
  sendToken(res, user);
});

export const protect = catchAsync(async (req, res, next) => {
  const authorization = req.cookies.jwt;

  let token;


  if (authorization) token = authorization;

  const decod = await jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decod.id);

  if (!user) return next(new errorApp('account does not exist.', 400));
  if (!token) return next(new errorApp('Log in first to access.', 401));

  const changePassword = user?.changedPasswordAfter(decod.iat);
  if (changePassword) {
    return next(new errorApp('The account password has been changed.', 401));
  }

  req.user = user;
  next();
});

export const accsess = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role))
      return next(new errorApp('cannot accsess this url'), 400);

    next();
  };
};
