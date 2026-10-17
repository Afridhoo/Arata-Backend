import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import { addValue, insertParams } from '../controller/controller_handler.js';
import { Booking } from '../models/model_booking.js';
import {
  cancelBookingById,
  chekingMaxGroup,
  getAllValueBooking,
  getRevenueBooking,
  getUserBooking,
  oneBookingMe,
  updateBooking,
} from '../controller/contolller_booking.js';

export const bookingRouter = express.Router({ mergeParams: true });

bookingRouter.use(protect);
bookingRouter
  .route('/')
  .get(accsess('admin'), getAllValueBooking)
  .post(
    accsess('user', 'admin'),
    insertParams,
    chekingMaxGroup,
    addValue(Booking),
  );
bookingRouter.route('/getRevenue').get(accsess('admin'), getRevenueBooking);
bookingRouter.route('/meBooking').get(getUserBooking);
bookingRouter.route('/cancel/:id').patch(cancelBookingById);

bookingRouter
  .route('/:id')
  .patch(accsess('admin'), updateBooking)
  .get(accsess('user', 'admin'), oneBookingMe);
