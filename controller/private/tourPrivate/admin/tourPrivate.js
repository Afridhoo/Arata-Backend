import mongoose from 'mongoose';
import catchAsync from '../../../../helper/catchAsync.js';
import { Booking } from '../../../../models/model_booking.js';
import { Tour } from '../../../../models/model_tour.js';
import { handleSorts } from '../../../controller_handler.js';

import { GetUserBookingUseFields } from '../../../../helper/handlerBooking.js';
import {
  AssignedGuideToTask,
  RemoveGuideFromTask,
} from '../../../../helper/handlerGuide.js';
import errorApp from '../../../../helper/errorQuery.js';
import { Guide } from '../../../../models/model_guides.js';
import { NotificationDateTour } from '../../../../helper/handlerNotification.js';

export const getIsActiveTourTrip = catchAsync(async (req, res, next) => {
  const tour = await Tour.aggregate([
    { $match: { isActiveTripTour: true } },
    {
      $addFields: {
        bookedCount: { $subtract: ['$maxGroupSize', '$slot'] },
      },
    },
    {
      $lookup: {
        from: 'documentations',
        let: { idTour: '$_id' },
        pipeline: [
          {
            $match: {
              statusDocumentation: 'ongoing',
              $expr: { $eq: ['$$idTour', '$tour'] },
            },
          },
        ],
        as: 'documentation',
      },
    },

    {
      $lookup: {
        from: 'guides',
        localField: '_id',
        foreignField: 'tour',
        as: 'guideAssigned',
      },
    },

    { $addFields: { totalGuidesHandle: { $size: '$guideAssigned' } } },

    {
      $project: {
        name: 1,
        bookedCount: 1,
        startLocation: 1,
        locations: 1,
        duration: 1,
        documentation: 1,
        maxGroupSize: 1,
        totalGuidesHandle: 1,
        imageCover: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: tour,
  });
});

export const GetToursBookingStats = catchAsync(async (req, res, next) => {
  const GetStats = await Booking.aggregate([
    {
      $group: {
        _id: '$tour',
        totalBooking: { $sum: 1 },
        totalCancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        totalPending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        totalConfirmed: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
        },
        revenueConfirmed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalPrice', 0],
          },
        },
        revenueCancelled: {
          $sum: {
            $cond: [{ $eq: ['$status', 'cancelled'] }, '$totalPrice', 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'tours',
        localField: '_id',
        foreignField: '_id',
        as: 'tour',
      },
    },
    { $unwind: '$tour' },
    {
      $project: {
        name: '$tour.name',
        totalBooking: 1,

        totalPending: 1,
        totalConfirmed: 1,
        totalCancelled: 1,

        revenueConfirmed: 1,
        revenueCancelled: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: GetStats,
  });
});

export const getToursBooking = catchAsync(async (req, res, next) => {
  const { limit, guideAssigned, guideReady, date, booking, name } =
    req.query || {};

  const match = {};
  const sorts = {};

  const checkDate = date === 'dateNotExist';
  if (name) match.name = { $regex: name, $options: 'i' };
  if (checkDate) match['startLocation.date'] = null;

  if (!checkDate)
    handleSorts({ value: date, key: 'startLocation.date.from', sorts });

  handleSorts({ value: guideReady, key: 'countGuidesReady', sorts });
  handleSorts({ value: guideAssigned, key: 'countGuidesAssigned', sorts });
  handleSorts({ value: booking, key: 'bookedCount', sorts });

  if (Object.keys(sorts).length === 0) sorts.createdAt = -1;

  const page = Math.max(Number(limit) || 1, 1);
  const limits = 10;

  const bookingTour = await Tour.aggregate([
    { $match: match },
    {
      $addFields: {
        categories: { $setUnion: ['$locations.destination.categories', []] },
      },
    },

    {
      $addFields: {
        bookedCount: { $subtract: ['$maxGroupSize', '$slot'] },
      },
    },

    {
      $lookup: {
        from: 'categoritours',
        localField: 'categories',
        foreignField: '_id',
        as: 'categoriesTour',
      },
    },

    {
      $lookup: {
        from: 'guides',
        localField: 'categories',
        foreignField: 'skillGuide',
        as: 'guideMatchSkill',
      },
    },

    {
      $addFields: {
        guideReady: {
          $filter: {
            input: '$guideMatchSkill',
            cond: { $eq: ['$$this.statusGuide', 'ready'] },
          },
        },
      },
    },
    {
      $addFields: {
        guideAssigned: {
          $filter: {
            input: '$guideMatchSkill',
            cond: {
              $eq: ['$$this.tour', '$_id'],
            },
          },
        },
      },
    },

    { $addFields: { countGuidesReady: { $size: '$guideReady' } } },
    { $addFields: { countGuidesAssigned: { $size: '$guideAssigned' } } },

    { $sort: sorts },

    { $skip: (page - 1) * limits },
    { $limit: limits },

    {
      $project: {
        name: 1,
        maxGroupSize: 1,
        categoriesTour: 1,
        bookedCount: 1,
        guideAssigned: 1,
        guideReady: 1,
        startLocation: 1,
        'locations.destination.description': 1,
        'locations.destination.categories': 1,
        'locations.destination._id': 1,
        'locations.hotel.description': 1,
        'locations.hotel.categories': 1,
        'locations.hotel._id': 1,
      },
    },
  ]);

  res.status(200).json({
    data: bookingTour,
  });
});

export const getOneToursBooking = catchAsync(async (req, res, next) => {
  const { IdTour } = req.params;

  const getTour = await Tour.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(IdTour) } },
    {
      $addFields: {
        categoriesListLocations: {
          $concatArrays: [
            '$locations.destination.categories',
            '$locations.hotel.categories',
            ['$categories'],
          ],
        },
      },
    },

    {
      $lookup: {
        from: 'categoritours',
        localField: 'categoriesListLocations',
        foreignField: '_id',
        as: 'GetCategories',
      },
    },

    {
      $addFields: {
        bookedCount: { $subtract: ['$maxGroupSize', '$slot'] },
      },
    },

    {
      $lookup: {
        from: 'guides',
        let: { idDestination: '$locations.destination._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $gt: [
                  {
                    $size: {
                      $setIntersection: [
                        {
                          $ifNull: ['$destinationHandle', []],
                        },
                        { $ifNull: ['$$idDestination', []] },
                      ],
                    },
                  },
                  0,
                ],
              },
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'guides',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          { $unwind: '$userInfo' },
          {
            $project: {
              skillGuide: 1,
              destinationHandle: 1,
              ratingsAverage: 1,
              ratingsQuantity: 1,
              userId: '$userInfo._id',
              name: '$userInfo.name',
              email: '$userInfo.email',
              photo: '$userInfo.photo',
            },
          },
        ],
        as: 'guideAssigned',
      },
    },
    {
      $lookup: {
        from: 'guides',
        let: { tourCategories: '$categoriesListLocations' },
        pipeline: [
          {
            $match: {
              statusGuide: 'ready',
              $expr: {
                $gt: [
                  {
                    $size: {
                      $setIntersection: [
                        { $ifNull: ['$skillGuide', []] },
                        { $ifNull: ['$$tourCategories', []] },
                      ],
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'guides',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          { $unwind: '$userInfo' },
          {
            $project: {
              skillGuide: 1,
              ratingsAverage: 1,
              ratingsQuantity: 1,
              userId: '$userInfo._id',
              name: '$userInfo.name',
              email: '$userInfo.email',
              photo: '$userInfo.photo',
            },
          },
        ],
        as: 'guideReady',
      },
    },

    {
      $addFields: {
        'locations.destination': {
          $map: {
            input: '$locations.destination',
            as: 'dest',
            in: {
              $mergeObjects: [
                '$$dest',
                {
                  candidateGuides: {
                    $filter: {
                      input: '$guideReady',
                      as: 'guide',
                      cond: {
                        $in: [
                          '$$dest.categories',
                          { $ifNull: ['$$guide.skillGuide', []] },
                        ],
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
      $unset: 'guideReady',
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: getTour[0],
  });
});

export const updateDatesTour = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;
  const {
    guide,
    dateDestination,
    dateHotel,
    nameTour,
    startLocation,
    idDeleteGuide,
    timeStart,
  } = req.body;

  if (idDeleteGuide.length > 0)
    await RemoveGuideFromTask({ idDeleteGuide, next });

  if (guide.length > 0) {
    const getIdGuide = guide?.map((el) => el._id);
    const getGuide = await Guide.find({ _id: { $in: getIdGuide } });

    const getGuideOnGoing = getGuide?.filter(
      (el) => el.statusGuide === 'ongoing',
    );

    if (getGuideOnGoing.length > 0)
      return next(
        new errorApp(
          'Salah Satu Guide Sudah Di Tugaskan Di Tempat Tujuan Lain 😊',
        ),
      );

    const getReadyGuide = getGuide
      ?.filter(
        (el) => el.statusGuide === 'pending' || el.statusGuide === 'ready',
      )
      .map((el) => el._id.toString());

    const getFinalGuide = guide?.filter((el) => getReadyGuide.includes(el._id));

    if (getFinalGuide.length > 0)
      await AssignedGuideToTask({ getFinalGuide, tourId });
  }

  const helperQuery = (val, fields) =>
    val.map((el) => ({
      updateOne: {
        filter: { _id: tourId, [`locations.${fields}._id`]: el._id },
        update: {
          $set: {
            [`locations.${fields}.$.date`]: el.date,
            [`locations.${fields}.$.time`]: el.time,
          },
        },
      },
    }));

  const formatDateDestination = helperQuery(dateDestination, 'destination');
  const formatDateHotel = helperQuery(dateHotel, 'hotel');
  const concatValDate = [
    ...(formatDateDestination || []),
    ...(formatDateHotel || []),
  ];

  if (startLocation)
    await Tour.findByIdAndUpdate(tourId, {
      'startLocation.date': startLocation?.date,
      $set: {
        'startLocation.time': timeStart,
      },
    });

  if (concatValDate.length > 0) {
    const getUserBooking = await GetUserBookingUseFields({
      fields: { tour: tourId, status: 'confirmed' },
    });

    await Promise.all([
      Tour.bulkWrite(concatValDate),
      getUserBooking?.length > 0 &&
        NotificationDateTour({ value: nameTour, userBooking: getUserBooking }),
    ]);
  }

  res.status(200).json({
    status: 'sucsess',
  });
});

export const deleteLocationTour = catchAsync(async (req, res, next) => {
  const { tour, idlocation } = req.params;

  // await Tour.findOneAndUpdate(
  //   { _id: tour },
  //   {
  //     $pull: {
  //       'locations.destination': { _id: idlocation },
  //       'locations.hotel': { _id: idlocation },
  //     },
  //   },
  // );

  res.status(204).send();
});

export const deleteTour = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // const [booking, guide] = await Promise.all([
  //   await Booking.find({ tour: id }),
  //   await Guide.find({ tour: id }),
  // ]);

  // const getUserId = [...(booking || []), ...(guide || [])].map(
  //   (el) => new mongoose.Types.ObjectId(el.user),
  // );

  // const valNotif = getUserId?.map((el) => ({
  //   user: el,
  //   tourId: id,
  //   createdAt: Date.now(),
  //   isRead: false,
  //   message: `Mohon Maaf , Tour Ini Kami Batalkan ,Hubungi Admin Untuk Detail Lebih Lanjut ❗`,
  // }));

  // await Promise.all([
  //   await Guide.updateMany(
  //     { tour: id },
  //     {
  //       $set: { destinationHandle: [], statusGuide: 'ready' },
  //       $unset: { tour: '', dateAssigned: '' },
  //     },
  //   ),
  //   await User.updateMany({ _id: getUserId }, { isActiveTrip: false }),

  //   await Booking.deleteMany({ tour: id }),
  //   await Notification.collection.insertMany(valNotif),
  //   await Tour.findByIdAndDelete(id),
  // ]);

  res.status(200).json({
    status: 'sucsess',
  });
});
