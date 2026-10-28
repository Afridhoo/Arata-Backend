import express from 'express';

import {
  addValue,
  chekingSearch,
  insertParams,
} from '../controller/controller_handler.js';
import { Notification } from '../models/model_notification.js';

import { accsess, protect } from '../middleware/auth/authorization.js';
import {
  getUserNotification,
  patchReadNotification,
} from '../controller/private/notification/user/notifPrivate.js';

export const notificationRouter = express.Router();

notificationRouter.use(protect);
notificationRouter.route('/').get(getUserNotification);
notificationRouter
  .route('/:bookingId')
  .post(accsess('admin'), insertParams, addValue(Notification));

notificationRouter
  .route('/update/:id')
  .patch(chekingSearch(Notification), patchReadNotification);
