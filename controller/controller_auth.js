import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';
import { sendToken, sendTokenLogout } from '../helper/tokenHelper.js';
import { User } from '../models/model_user.js';

import { OAuth2Client } from 'google-auth-library';
import { uploadGoogleImg } from '../helper/cloudinary.js';
import { SendEmail } from '../Api/Email/SendEmail.js';
import crypto from 'crypto';
import { UserDelayed } from '../models/model_userDelayed.js';
import {
  checkIsLimitSendemail,
  checkIsLimitSendOtp,
  checkisOTPExpired,
  checkOtpValid,
} from '../Api/Email/ValidationEmail.js';

export const otpAuthRegister = catchAsync(async (req, res, next) => {
  const OTP = crypto.randomInt(100000, 1000000);
  const OTP_EXPIRED = Date.now() + 5 * 60 * 1000;
  const SEND_EMAIL_LIMIT = Date.now() + 10 * 60 * 1000;

  const { name, email, otpUser, confirmPassword, password, telphone } =
    req.body;

  const [getUser, getUserDelayed] = await Promise.all([
    User.findOne({ email }).select('+otp'),
    UserDelayed.findOne({ email }),
  ]);

  if (getUser)
    return next(
      new errorApp('Email Ini Sudah Terdaftar Silahkan Login Ulang', 400),
    );

  if (getUserDelayed) {
    const {
      email,
      name,
      otp,
      otpExpired,
      countSendEmail,
      countSendOtp,
      _id,
      blockedSendOtp,
      blockedSendEmail,
    } = getUserDelayed;

    if (!checkisOTPExpired(blockedSendEmail)) {
      return next(
        new errorApp(
          'Permintaan Mengirimkan Kode OTP Melalui Email Di Batasi , Tunggu 10 Menit Lagi',
          400,
        ),
      );
    }

    if (!checkisOTPExpired(blockedSendOtp)) {
      return next(
        new errorApp(
          'Permintaan Mengirimkan Kode OTP Di Batasi , Tunggu 5 Menit Lagi',
          400,
        ),
      );
    }

    if (checkisOTPExpired(otpExpired)) {
      await Promise.all([
        UserDelayed.findByIdAndUpdate(_id, {
          $inc: { countSendEmail: 1 },
          countSendOtp: 0,
          otpExpired: OTP_EXPIRED,
          otp: OTP,
        }),
        SendEmail({ name, toEmail: email, OTP }),
      ]);

      return res.status(200).json({
        status: 'sucsess send Email',
        message: `Kode Otp Verifikasi Sudah Di Kirim  Ke Email ${email}`,
      });
    }

    if (
      checkIsLimitSendemail(countSendEmail) &&
      checkIsLimitSendOtp(countSendOtp)
    ) {
      await UserDelayed.findByIdAndUpdate(_id, {
        blockedSendEmail: SEND_EMAIL_LIMIT,
        countSendEmail: 0,
        countSendOtp: 0,
      });
      return next(
        new errorApp(
          'Permintaan Mengirimkan Kode OTP Melalui Email Di Batasi , Tunggu 10 Menit Lagi',
          400,
        ),
      );
    }

    if (checkIsLimitSendOtp(countSendOtp)) {
      await UserDelayed.findByIdAndUpdate(_id, {
        blockedSendOtp: OTP_EXPIRED,
        countSendOtp: 0,
      });
      return next(
        new errorApp(
          'Permintaan Mengirimkan Kode OTP Di Batasi , Tunggu 5 Menit Lagi',
          400,
        ),
      );
    }

    if (!checkOtpValid(otp, otpUser)) {
      await UserDelayed.findByIdAndUpdate(_id, {
        $inc: { countSendOtp: 1 },
      });

      return next(new errorApp('Kode OTP Salah , Silahkan Coba Lagi'), 400);
    }

    if (checkOtpValid(otp, otpUser)) {
      await UserDelayed.findByIdAndDelete(_id);

      const newUser = await User.create({
        name,
        email,
        password,
        confirmPassword,
        role: 'user',
        telphone,
      });

      sendToken(res, newUser);
    }
  }

  if (!getUserDelayed) {
    await Promise.all([
      UserDelayed.create({
        name,
        email,
        otp: OTP,
        otpExpired: OTP_EXPIRED,
        countSendOtp: 0,
        countSendEmail: 1,
      }),

      SendEmail({ name, toEmail: email, OTP }),
    ]);

    return res.status(200).json({
      status: 'sucsess send Email',
      message: `Kode Otp Verifikasi Sudah Di Kirim  Ke Email ${email}`,
    });
  }
});

export const login = catchAsync(async (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return next(new errorApp('Silahkan Masukan Email Dan Password', 400));
  }
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +loginAttempts');
  if (!user) return next(new errorApp('account does not exist.', 404));

  if (!user.isEmailVerified)
    return next(new errorApp('Anda Belum Melakukan Verivikasi OTP', 400));

  if (!user.active)
    return next(
      new errorApp(
        'Akun Anda Sudah Dinonaktifkan Hubungi Admin Detail Lebih Lanjut',
        400,
      ),
    );

  if (user.blockPasswordLogin > Date.now()) {
    return next(new errorApp('Please wait 10 minutes for login again', 400));
  }

  const correctPassword = await user?.compareBycrpt(password, user.password);
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
    return next(new errorApp(`Email ${email} Belum Terverifikasi`));

  let userData = await User.exists({ googleId: sub });

  if (!userData) {
    const checkEmailIsReady = await User.exists({ email });

    if (checkEmailIsReady) {
      userData = await User.findOneAndUpdate(
        { email },
        {
          $set: {
            googleId: sub,
            isEmailVerified: true,
            authProvider: 'local',
          },
        },
      );
    } else {
      userData = await User.create({
        name,
        email,
        googleId: sub,
        isEmailVerified: true,
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
  const chekingPassword = await user?.compareBycrpt(password, user.password);

  if (!chekingPassword)
    return next(new errorApp('Passsword Tidak Sesuai'), 401);

  user.password = newPassword;
  user.confirmPassword = confirmPassword;

  await user.save();
  sendToken(res, user);
});
