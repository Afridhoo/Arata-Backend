import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import {
  addValue,
  chekingSearch,
  insertParams,
} from '../controller/controller_handler.js';
import { Notification } from '../models/model_notification.js';
import {
  getUserNotification,
  patchReadNotification,
} from '../controller/contoller_notification.js';

export const notificationRouter = express.Router();

notificationRouter.use(protect);
notificationRouter.route('/').get(getUserNotification);
notificationRouter
  .route('/:bookingId')
  .post(accsess('admin'), insertParams, addValue(Notification));

notificationRouter
  .route('/update/:id')
  .patch(chekingSearch(Notification), patchReadNotification);
