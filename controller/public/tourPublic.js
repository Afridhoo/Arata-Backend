import mongoose from "mongoose";
import catchAsync from "../../helper/catchAsync.js";
import { Booking } from "../../models/model_booking.js";
import { User } from "../../models/model_user.js";
import { Tour } from "../../models/model_tour.js";
import { handleObjMongoose } from "../../helper/handlerObjMongoose.js";
import { handleSorts } from "../controller_handler.js";
import { checkTokenIsValid } from "../../helper/tokenHelper.js";
import { CategoriesTour } from "../../models/model_categories.js";
import { Favorite } from "../../models/model_favorite.js";

export const getTourHomePage = catchAsync(async (req, res, next) => {
  const [getGuide, getTour] = await Promise.all([
    User.aggregate([
      { $match: { role: 'guide' } },

      { $limit: 5 },

      {
        $lookup: {
          from: 'guides',
          localField: '_id',
          foreignField: 'guides',
          as: 'guideDataHandle',
        },
      },

      { $unwind: '$guideDataHandle' },

      {
        $project: {
          name: 1,
          photo: 1,
          email: 1,
          'guideDataHandle.assignedAt': 1,
          'guideDataHandle.ratingsAverage': 1,
          'guideDataHandle.ratingsQuantity': 1,
          'guideDataHandle.finishedHandle': 1,
        },
      },
    ]),
    Booking.aggregate([
      { $match: { status: 'finished' } },

      {
        $group: {
          _id: '$tour',
          bookedCount: { $sum: 1 },
          quantityBooking: { $sum: '$quantity' },
        },
      },

      {
        $lookup: {
          from: 'reviews',
          let: { idTour: '$_id' },

          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $gt: ['$rating', 3] },
                    { $eq: ['$tour', '$$idTour'] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'identity',
              },
            },
            { $unwind: '$identity' },
            {
              $project: {
                'identity.name': 1,
                'identity.photo': 1,
                rating: 1,
                message: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'GetReview',
        },
      },

      { $sort: { bookedCount: -1 } },
      { $limit: 5 },

      {
        $lookup: {
          from: 'favorites',
          localField: '_id',
          foreignField: 'tour',
          as: 'favoriteTour',
        },
      },

      {
        $lookup: {
          from: 'tours',
          localField: '_id',
          foreignField: '_id',
          as: 'GetTour',
        },
      },

      { $unwind: '$GetTour' },

      {
        $project: {
          'GetTour.name': 1,
          'GetTour.locations': 1,
          'GetTour.slot': 1,
          'GetTour.maxGroupSize': 1,
          'GetTour._id': 1,
          countFavorite: { $size: '$favoriteTour' },
          'GetTour.imageCover': 1,
          'GetTour.summary': 1,
          'GetTour.description': 1,
          'GetTour.price': 1,
          'GetTour.priceDiscount': 1,
          bookedCount: 1,
          listGuide: 1,
          GetReview: 1,
        },
      },
    ]),
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: { getTour, getGuide },
  });
});




export const getOneTour = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const getTour = await Tour.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },

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
        from: 'reviews',
        let: { idTour: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$$idTour', '$tour'] },
            },
          },

          { $limit: 5 },

          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'identity',
            },
          },
          { $unwind: '$identity' },
          {
            $project: {
              'identity.name': 1,
              'identity.photo': 1,
              rating: 1,
              message: 1,
              createdAt: 1,
            },
          },
        ],
        as: 'Review',
      },
    },

    {
      $lookup: {
        from: 'categoritours',
        localField: 'categoriesListLocations',
        foreignField: '_id',
        as: 'getCategories',
      },
    },

    {
      $addFields: {
        categories: {
          $first: {
            $filter: {
              input: '$getCategories',
              as: 'categoriesData',
              cond: {
                $eq: ['$$categoriesData._id', '$categories'],
              },
            },
          },
        },
      },
    },

    {
      $addFields: {
        'locations.destination': {
          $map: {
            input: '$locations.destination',
            as: 'locDest',
            in: {
              $mergeObjects: [
                '$$locDest',
                {
                  categories: {
                    $first: {
                      $filter: {
                        input: '$getCategories',
                        as: 'dest',
                        cond: {
                          $eq: ['$$dest._id', '$$locDest.categories'],
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
      $addFields: {
        'locations.hotel': {
          $map: {
            input: '$locations.hotel',
            as: 'locHotel',
            in: {
              $mergeObjects: [
                '$$locHotel',
                {
                  categories: {
                    $first: {
                      $filter: {
                        input: '$getCategories',
                        as: 'dest',
                        cond: {
                          $eq: ['$$dest._id', '$$locHotel.categories'],
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
      $lookup: {
        from: 'guides',
        let: { idTour: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$$idTour', '$tour'] },
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
              'guideIdentity.name': 1,
              'guideIdentity.email': 1,
              'guideIdentity.telphone': 1,
              'guideIdentity.photo': 1,
              dateAssigned: 1,
              _id: 1,
              skillGuide: 1,
              ratingsAverage: 1,
              ratingsQuantity: 1,
              finishedHandle: 1,
              assignedAt: 1,
            },
          },
        ],
        as: 'guide',
      },
    },

    { $unset: ['getCategories', 'categoriesListLocations'] },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: getTour[0],
  });
});




export const getAllTour = catchAsync(async (req, res, next) => {
  const authorization = await checkTokenIsValid(req.cookies.jwt);
  const { status, idUser } = authorization;

  const match = {};
  const sort = {};

  const { categoriesHotel, categoriesDest, price, limit, name, booking } =
    req.query || {};

  if (booking) handleSorts({ value: booking, key: 'bookedCount', sorts: sort });
  if (name) match.name = { $regex: name, $options: 'i' };

  if (categoriesDest)
    match['locations.destination.categories'] = {
      $in: handleObjMongoose(categoriesDest),
    };
  if (categoriesHotel)
    match['locations.hotel.categories'] = {
      $in: handleObjMongoose(categoriesHotel),
    };

  if (price) match.price = { $gte: Number(price[0]), $lte: Number(price[1]) };

  sort.createdAt = 1;
  const page = Math.max(Number(limit) || 1, 1);
  const limits = 10;

  const [getCategories, getFavorite, value] = await Promise.all([
    CategoriesTour.find({ status: 'active' }),
    status && Favorite.find({ user: idUser }),
    Tour.aggregate([
      { $match: match },

      {
        $addFields: {
          bookedCount: { $subtract: ['$maxGroupSize', '$slot'] },
        },
      },

      { $sort: sort },

      { $skip: (page - 1) * limits },
      { $limit: limits },
    ]),
  ]);

  res.status(200).json({
    status: 'sucsess',
    messsage: 'Sucsess To Get Data',

    data: {
      value,
      getFavorite,
      getCategories,
    },
  });
});