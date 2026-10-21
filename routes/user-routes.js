import express from 'express';
import {
  deleteUser,
  updateUser,
  getStatsMe,
  convertImageUser,
  findUserBy,
  getTrip,
  getUserAndBooking,
  getAccountMe,
} from '../controller/controller_user.js';

import {
  accsess,
  forgotPassword,
  login,
  loginByGoogle,
  logOut,
  otpAuthRegister,
  protect,
  resetPassword,
  
  updatePassword,
} from '../controller/controller_auth.js';

import { uploadImageUser } from '../helper/multer.js';

export const userRouter = express.Router();
userRouter.route('/signup').post(otpAuthRegister);


userRouter.route('/login').post(login);
userRouter.route('/logOut').post(logOut);

userRouter.route('/loginByGoogle').post(loginByGoogle);

userRouter.route('/forgotPassword').post(forgotPassword);
userRouter.route('/resetPassword/:token').patch(resetPassword);



userRouter.use(protect);
userRouter.route('/getAccount').get(getAccountMe);
userRouter.route('/getStatsMe').get(getStatsMe);
userRouter.route('/updatePassword').patch(updatePassword);
userRouter
  .route('/updateAccount')
  .patch(uploadImageUser, convertImageUser, updateUser);
userRouter.route('/deleteAccount').delete(deleteUser);

userRouter.route('/getUser').get(accsess('admin'), findUserBy);

userRouter.route('/getTripMe').get(accsess('user', 'admin'), getTrip);
userRouter
  .route('/getUserAndBooking/:userId')
  .get(accsess('guide'), getUserAndBooking);
