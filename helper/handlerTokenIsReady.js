import jwt from 'jsonwebtoken';
import { User } from '../models/model_user.js';

export async function checkTokenIsValid(authorization) {
  let token;
  if (authorization) token = authorization;

  const decod = token ? await jwt.verify(token, process.env.JWT_SECRET) : null;
  const user = decod ? await User.findById(decod.id) : null;

  return { status: !!user, idUser: user?.id, user, token, decod };
}
