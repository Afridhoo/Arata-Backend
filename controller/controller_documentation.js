import mongoose from 'mongoose';
import catchAsync from '../helper/catchAsync.js';
import { Documentation } from '../models/model_dokumentation.js';
import errorApp from '../helper/errorQuery.js';

export const getDocumentationMe = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  if (!middelwareReq) return next(new errorApp('Id NOT FOUND', 404));

  const docMe = await Documentation.aggregate([
    { $match: { 'userBooking.userId': middelwareReq._id } },

    {
      $lookup: {
        from: 'tours',
        localField: 'tour',
        foreignField: '_id',
        as: 'getTour',
      },
    },

    {
      $lookup: {
        from: 'bookings',
        let: { idBooking: '$userBookingId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', middelwareReq._id] },
                  { $in: ['$_id', { $ifNull: ['$$idBooking', []] }] },
                ],
              },
            },
          },
          {
            $project: {
              dateFinished: 1,
              bookingDate: 1,
            },
          },
        ],
        as: 'detailBooking',
      },
    },

    { $unwind: '$getTour' },

    {
      $project: {
        guide: { $size: '$guide' },
        trip: { $size: '$trip' },
        detailBooking: 1,
        'getTour.name': 1,
        'getTour.imageCover': 1,
        hotel: { $size: '$getTour.locations.hotel' },
        destination: { $size: '$getTour.locations.destination' },
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: docMe,
  });
});

export const getDocById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  

  const middelwareReq = req.user;
  const objId = new mongoose.Types.ObjectId(id);

  const checking = await Documentation.exists({
    _id: objId,
    'userBooking.userId': { $in: middelwareReq._id },
  });

  if (!checking) return next(new errorApp('Tidak Bisa Mengakses URL ini', 400));

  const getDoc = await Documentation.aggregate([
    { $match: { _id: objId } },

    {
      $lookup: {
        from: 'tours',
        localField: 'tour',
        foreignField: '_id',
        as: 'getTour',
      },
    },

    { $unwind: '$getTour' },

    {
      $lookup: {
        from: 'bookings',
        let: { idBooking: '$userBookingId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', middelwareReq._id] },
                  { $in: ['$_id', { $ifNull: ['$$idBooking', []] }] },
                ],
              },
            },
          },
        ],
        as: 'detailBooking',
      },
    },

    {
      $lookup: {
        from: 'reviews',
        let: { idBooking: '$userBookingId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', middelwareReq._id] },
                  { $in: ['$booking', { $ifNull: ['$$idBooking', []] }] },
                ],
              },
            },
          },
        ],
        as: 'reviewTour',
      },
    },

    { $unwind: '$detailBooking' },

    {
      $lookup: {
        from: 'guidereviews',
        let: { idBooking: '$userBookingId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', middelwareReq._id] },
                  { $in: ['$booking', { $ifNull: ['$$idBooking', []] }] },
                ],
              },
            },
          },
        ],
        as: 'guideReview',
      },
    },

    {
      $lookup: {
        from: 'guides',
        let: { idGuide: '$guide' },
        pipeline: [
          {
            $match: {
              $expr: { $in: ['$_id', { $ifNull: ['$$idGuide', []] }] },
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'guides',
              foreignField: '_id',
              as: 'guideIdentity',
            },
          },

          { $unwind: '$guideIdentity' },

          {
            $project: {
              name: '$guideIdentity.name',
              photo: '$guideIdentity.photo',
              ratingsAverage: 1,
              ratingsQuantity: 1,
              finishedHandle: 1,

              guides: 1,
            },
          },
        ],
        as: 'dataGuide',
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: getDoc,
  });
});


