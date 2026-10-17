import mongoose from 'mongoose';
import catchAsync from '../helper/catchAsync.js';
import { Documentation } from '../models/model_dokumentation.js';
import { GuideHistory } from '../models/model_guideHistory.js';
import { Guide } from '../models/model_guides.js';

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
                    $concatArrays: ['$getTour.locations.destination', '$getTour.locations.hotel'],
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

  const getDoc = await Documentation.aggregate([
    {
      $match: {
        tour: new mongoose.Types.ObjectId(idTour),
        guide: { $eq: getMeGuide._id },
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
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: getDoc,
  });
});
