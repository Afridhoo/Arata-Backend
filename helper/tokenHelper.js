import jwt from 'jsonwebtoken';
import { User } from '../models/model_user.js';

export const tokenHelper = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED,
  });

export const sendTokenLogout = (res) => {
  const env = process.env;
  const checkProduction = env.NODE_ENV === 'production';

  const cookies = {
    expires: new Date(Date.now() + 100 * 1000),
    httpOnly: true,
    sameSite: checkProduction ? 'none' : 'lax',
    secure: checkProduction,
  };

  res.cookie('jwt', 'logout', cookies);
  return res.status(200).json({
    status: 'success',
  });
};

export const sendToken = (res, user) => {
  const milSecond = 24 * 60 * 60 * 1000;
  const env = process.env;
  const token = tokenHelper(user._id);

  const checkProduction = env.NODE_ENV === 'production';

  const cookies = {
    expires: new Date(Date.now() + env.JWT_COOKIES_EXPIRES * milSecond),
    httpOnly: true,
    sameSite: checkProduction ? 'none' : 'lax',
    secure: checkProduction,
  };

  res.cookie('jwt', token, cookies);

  user.password = undefined;

  return res.status(200).json({
    status: 'success',

    data: {
      user,
    },
  });
};

export async function checkTokenIsValid(authorization) {
  let token;
  if (authorization) token = authorization;

  const decod = token ? await jwt.verify(token, process.env.JWT_SECRET) : null;
  const user = decod ? await User.findById(decod.id) : null;

  return { status: !!user, idUser: user?.id, user, token, decod };
}
