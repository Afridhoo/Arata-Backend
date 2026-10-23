import mongoose from 'mongoose';
import catchAsync from '../helper/catchAsync.js';
import { Documentation } from '../models/model_dokumentation.js';
import { GuideHistory } from '../models/model_guideHistory.js';
import { Guide } from '../models/model_guides.js';
import errorApp from '../helper/errorQuery.js';

export const getHistoriesMe = catchAsync(async (req, res, next) => {
  const middlewareReq = req.user;

  const getGuideHistory = await GuideHistory.aggregate([
    { $match: { guide: middlewareReq._id } },
    {
      $sort: { completedAt: -1 },
    },
    {
      $group: {
        _id: '$tour',
        guide: { $first: '$guide' },
        lastAssigned: { $first: '$destination' },
        lastAssignedDate: { $first: '$completedAt' },
        totalsHanlde: { $sum: 1 },
      },
    },

    {
      $lookup: {
        from: 'guides',
        localField: 'guide',
        foreignField: 'guides',
        as: 'dataGuide',
      },
    },

    { $unwind: '$dataGuide' },

    {
      $lookup: {
        from: 'tours',
        localField: '_id',
        foreignField: '_id',
        as: 'getTour',
      },
    },
    { $unwind: '$getTour' },

    {
      $lookup: {
        from: 'guidereviews',
        let: { idTour: '$_id', guide: '$guide' },

        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$tour', '$$idTour'] },
                  { $eq: ['$guide', '$$guide'] },
                ],
              },
            },
          },

          {
            $group: {
              _id: null,
              rating: { $avg: '$rating' },
              totalsRating: { $sum: 1 },
            },
          },
        ],
        as: 'guideReview',
      },
    },

    { $unwind: { path: '$guideReview', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        histories: {
          location: {
            $first: [
              {
                $filter: {
                  input: {
                    $concatArrays: [
                      '$getTour.locations.destination',
                      '$getTour.locations.hotel',
                    ],
                  },
                  cond: {
                    $eq: ['$$this._id', '$lastAssigned'],
                  },
                },
              },
            ],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: getGuideHistory,
  });
});

export const getHistoriesById = catchAsync(async (req, res, next) => {
  const { id: idTour } = req.params;
  const middlewareReq = req.user;

  const getMeGuide = await Guide.findOne({ guides: middlewareReq._id });
  const checkUserIsExist = await Documentation.exists({
    'userBooking.userId': { $in: middlewareReq._id },
  });

  if (!getMeGuide && !checkUserIsExist)
    return next(new errorApp('Tidak Bisa Mengakses URL Ini', 400));

  const getDoc = await Documentation.aggregate([
    {
      $match: {
        tour: new mongoose.Types.ObjectId(idTour),
        $or: [
          { guide: { $eq: getMeGuide?._id } },
          { 'userBooking.userId': { $eq: middlewareReq?._id } },
        ],
      },
    },

    {
      $lookup: {
        from: 'guides',
        let: { idGuide: '$guide' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', '$$idGuide'],
              },
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'guides',
              foreignField: '_id',
              as: 'GuideIdentity',
            },
          },
          {
            $project: {
              'GuideIdentity.name': 1,
              'GuideIdentity.photo': 1,
              guides: 1,
            },
          },
        ],
        as: 'DataGuide',
      },
    },

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
      $addFields: {
        trip: {
          $map: {
            input: '$trip',
            as: 't',
            in: {
              $mergeObjects: [
                '$$t',
                {
                  guideUpload: {
                    $first: {
                      $filter: {
                        input: '$DataGuide',
                        as: 'g',
                        cond: {
                          $eq: ['$$g.guides', '$$t.guideIdentityUpload'],
                        },
                      },
                    },
                  },
                },
                {
                  locationsHandle: {
                    $first: {
                      $filter: {
                        input: {
                          $concatArrays: [
                            '$getTour.locations.destination',
                            '$getTour.locations.hotel',
                          ],
                        },
                        as: 'tour',
                        cond: {
                          $eq: ['$$tour._id', '$$t.destination'],
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        'trip.locationsHandle': 1,
        'trip.note': 1,
        'trip.guideUpload': 1,
        'trip.images': 1,
        'trip.uploadAt': 1,
        userBooking: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: getDoc,
  });
});
