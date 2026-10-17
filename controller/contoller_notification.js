import catchAsync from '../helper/catchAsync.js';

import { Notification } from '../models/model_notification.js';

export const getUserNotification = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  const notifications = await Notification.find({
    user: middelwareReq,
  }).populate([
    {
      path: 'booking',
      populate: [
        {
          path: 'tour',
          select: 'name imageCover isActiveTripTour',
        },
      ],
    },
  ]);

  res.status(200).json({
    status: 'Sucsess',
    result: notifications.length,
    data: notifications,
  });
});

export const patchReadNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notif = await Notification.findByIdAndUpdate(id, {
    isRead: true,
  });

  res.status(200).json({
    status: 'sucsess',
    data: notif,
  });
});
