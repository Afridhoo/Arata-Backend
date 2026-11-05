import { User } from '../models/model_user.js';

export async function UpdateUser(idUser, update) {
  return await User.findByIdAndUpdate(idUser, update);
}
