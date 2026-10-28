import express from 'express';

import { addValue, insertParams } from '../controller/controller_handler.js';
import { Booking } from '../models/model_booking.js';

import {
  getAllValueBooking,
  getRevenueBooking,
  updateBooking,
} from '../controller/private/booking/admin/bookingPrivate.js';
import {
  cancelBookingById,
  getUserBooking,
  oneBookingMe,
} from '../controller/private/booking/user/bookingPrivate.js';
import { chekingMaxGroup } from '../middleware/booking/checkMaxGroup.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

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
bookingRouter.route('/meBooking').get(accsess('user', 'admin'), getUserBooking);
bookingRouter.route('/cancel/:id').patch(cancelBookingById);

bookingRouter
  .route('/:id')
  .patch(accsess('admin'), updateBooking)
  .get(accsess('user', 'admin'), oneBookingMe);
