import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';
import { Booking } from '../models/model_booking.js';
import { Tour } from '../models/model_tour.js';
import { streamUpload } from '../helper/cloudinary.js';
import { Notification } from '../models/model_notification.js';

import mongoose from 'mongoose';
import { Guide } from '../models/model_guides.js';
import { User } from '../models/model_user.js';
import { ApiCallOpenRouter } from '../Api/ApiOpenRouter.js';

import { CategoriesTour } from '../models/model_categories.js';
import jwt from 'jsonwebtoken';
import { Favorite } from '../models/model_favorite.js';
import { handleSorts } from './controller_handler.js';

export const getFilterTour = async (req, res, next) => {
  req.filterQuery = {
    limit: '5',
    sort: '-ratingsAverage,price',
    fields: 'name,price,ratingsAverage,summary,difficulty',
  };

  next();
};

export const getAllTour = catchAsync(async (req, res, next) => {
  const authorization = req.cookies.jwt;

  const match = {};
  const sort = {};

  const { categoriesHotel, categoriesDest, price, limit, name, booking } =
    req.query || {};

  if (booking) handleSorts({ value: booking, key: 'bookedCount', sorts: sort });

  if (name) match.name = { $regex: name, $options: 'i' };

  const handleObj = (val) => val?.map((x) => new mongoose.Types.ObjectId(x));

  if (categoriesDest)
    match['locations.destination.categories'] = {
      $in: handleObj(categoriesDest),
    };
  if (categoriesHotel)
    match['locations.hotel.categories'] = { $in: handleObj(categoriesHotel) };

  if (price) match.price = { $gte: Number(price[0]), $lte: Number(price[1]) };

  sort.createdAt = -1;
  const page = Math.max(Number(limit) || 1, 1);
  const limits = 10;

  let token;
  if (authorization) token = authorization?.split(' ')?.[1];
  const decod = token ? await jwt.verify(token, process.env.JWT_SECRET) : null;
  const user = decod ? await User.findById(decod.id) : null;

  const [getCategories, getFavorite, value] = await Promise.all([
    CategoriesTour.find({ status: 'active' }),
    user && Favorite.find({ user: user._id }),
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
          favoriteTour: 1,
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

export const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(new errorApp('Please Enter Your lat,lng'), 400);
  }

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tour = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'sucsess',
    result: tour.length,
    data: {
      tour,
    },
  });
});

export const getDistanceLocTour = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(new errorApp('Please Enter Your lat,lng'), 400);
  }
  const multiper = unit === 'mi' ? 0.000621371 : 0.001;

  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        distanceField: 'distances',
        distanceMultiplier: multiper,
        spherical: true,
      },
    },
    {
      $project: {
        name: 1,
        distances: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: {
      distance,
    },
  });
});

export const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: {
      stats,
    },
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

export const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = Number(req.params.year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-30`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        amountTours: { $sum: 1 },
        ToursList: {
          $push: {
            nameTour: '$name',
            priceTour: '$price',
          },
        },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: {
      plan,
    },
  });
});

export const convertImgUpdate = catchAsync(async (req, res, next) => {
  const files = req.files;

  const locationsUpdate = req.body.locationUpdate;
  const soldOut = req.body.soldOut;

  if (soldOut) req.body.soldOut = JSON.parse(soldOut);

  const handlePromise = async (value) =>
    files?.[value] &&
    (await Promise.all(files?.[value]?.map((el) => streamUpload(el.buffer))));

  if (files) {
    const [imgCover, imgsHotel, imgsDest] = await Promise.all([
      handlePromise('imageCover'),
      handlePromise('imagesHotel'),
      handlePromise('imagesDestination'),
    ]);

    const getSecureUrl = (value) => value?.map((el) => el.secure_url);

    if (locationsUpdate) {
      const { destination, hotel } = JSON.parse(locationsUpdate);

      function formatUpdateLoc(value, img) {
        let idx = 0;

        return value?.map((el) => ({
          ...el,
          image: !el.image ? getSecureUrl(img)[idx++] : el.image,
        }));
      }

      const formatLocations = {
        destination: formatUpdateLoc(destination, imgsDest),
        hotel: formatUpdateLoc(hotel, imgsHotel),
      };

      req.body.locations = formatLocations;
    }
    if (files.imageCover) req.body.imageCover = imgCover[0].secure_url;
  }

  next();
});

export const convertImage = catchAsync(async (req, res, next) => {
  const files = req.files;

  const locations = JSON.parse(req.body.locations);
  const startLocation = JSON.parse(req.body.startLocation);

  const handlePromise = async (value) =>
    files?.[value] &&
    (await Promise.all(files?.[value]?.map((el) => streamUpload(el.buffer))));

  const [imageCover, imagesHotel, imagesDestination] = await Promise.all([
    handlePromise('imageCover'),
    handlePromise('imagesHotel'),
    handlePromise('imagesDestination'),
  ]);

  const getSecureUrl = (value) => value?.map((el) => el.secure_url);

  if (files) {
    if (files.imageCover) req.body.imageCover = imageCover[0].secure_url;

    const urlImgHotel = getSecureUrl(imagesHotel);
    const urlImgDestination = getSecureUrl(imagesDestination);

    const formatHelper = (fields, imgUrl) =>
      locations?.[fields]?.map((el, idx) => ({
        ...el,
        image: imgUrl[idx],
      }));

    const formatLocation = {
      destination: formatHelper('destination', urlImgDestination),
      hotel: formatHelper('hotel', urlImgHotel),
    };

    req.body.locations = formatLocation;
    req.body.startLocation = startLocation;
  }

  next();
});

export const getLocationSearch = catchAsync(async (req, res, next) => {
  const { search } = req.params;

  const resApi = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&polygon_geojson=1`,
    {
      headers: {
        'User-Agent': 'MyApp/1.0',
      },
    },
  );

  const data = await resApi.json();
  if (data.length === 0) return next(new errorApp('Not Found Search', 400));

  res.status(200).json({
    status: 'sucsess',
    result: data.length,
    data,
  });
});

export const insertLatlng = (model) => (req, res, next) => {
  const getLatLng = req.params[model].split(',');

  req.lat = Number(getLatLng[1]);
  req.lng = Number(getLatLng[0]);

  next();
};

export const getLocationLatlng = catchAsync(async (req, res, next) => {
  const lat = req.lat;
  const lng = req.lng;

  const resApi = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&polygon_geojson=1`,
    {
      headers: {
        'User-Agent': 'MyApp/1.0',
      },
    },
  );

  const data = await resApi.json();

  res.status(200).json({
    data,
  });
});

export const getTourDestination = catchAsync(async (req, res, next) => {
  const lat = req.lat;
  const lng = req.lng;
  const apikey = process.env.GEOAPIFY_API;

  const [destination, hotel] = await Promise.all([
    fetch(
      `https://api.geoapify.com/v2/places?categories=tourism.attraction&filter=circle:${lng},${lat},10000&limit=10&apiKey=${apikey}`,
    ),

    fetch(
      `https://api.geoapify.com/v2/places?categories=accommodation.hotel&filter=circle:${lng},${lat},10000&limit=10&apiKey=${apikey}`,
    ),
  ]);

  const [dataDestination, dataHotel] = await Promise.all([
    destination.json(),
    hotel.json(),
  ]);

  const data = {
    destinations: dataDestination.features,
    hotels: dataHotel.features,
  };

  res.status(200).json({
    status: 'sucsess',
    resultDestination: data.hotels.length,
    resultHotels: data.destinations.length,
    data,
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

  if (idDeleteGuide.length > 0) {
    const getGuideDelete = await Guide.find({ _id: { $in: idDeleteGuide } });
    const getGuideAccDelete = getGuideDelete?.filter(
      (el) => el.statusGuide === 'ongoing',
    );

    if (getGuideAccDelete.length > 0)
      return next(
        new errorApp(
          'Guide Yang Ingin Anda Hapus Sudah Di Tugaskan Di Tempat Wisata Lain , Silahkan Refresh Page 😊',
        ),
      );
    const guideDelete = getGuideDelete
      ?.filter((el) => el.statusGuide !== 'ongoing')
      .map((el) => el._id);

    if (guideDelete.length > 0)
      await Guide.updateMany(
        {
          _id: { $in: guideDelete },
          statusGuide: { $in: ['pending', 'ready'] },
        },
        {
          tour: null,
          destinationHandle: [],
          dateAssigned: null,
          statusGuide: 'ready',
        },
      );
  }

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

    if (getFinalGuide.length > 0) {
      const formatBulkWriteGuide = getFinalGuide.map((el) => ({
        updateOne: {
          filter: { _id: el._id, statusGuide: { $in: ['pending', 'ready'] } },
          update: {
            $set: {
              tour: tourId,
              destinationHandle: el.destination?.map(
                (el) => new mongoose.Types.ObjectId(el),
              ),

              statusGuide: 'pending',
              dateAssigned: Date.now(),
            },
          },
        },
      }));

      await Guide.bulkWrite(formatBulkWriteGuide);
    }
  }

  const helperQuery = (val, fields) =>
    val.map((el) => ({
      updateOne: {
        filter: { _id: tourId, [`locations.${fields}._id`]: el._id },
        update: {
          $set: {
            [`locations.${fields}.$.date`]: el.date,
            [`locations.${fields}.$.time`]: el.time,
            soldOut: true,
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
      isActiveTripTour: true,
      $set: {
        'startLocation.time': timeStart,
      },
    });

  if (concatValDate.length > 0) {
    const getUserBooking = await Booking.find({
      tour: tourId,
      status: 'confirmed',
    });

    const formatNotif = getUserBooking?.map((el) => ({
      booking: el._id,
      user: el.user,
      message: `Tanggal Keberangkatan Dan Pemandu Sudah Di Tentukan , Untuk Tour ${nameTour} yang kamu Booking ,Pastikan Rombongan Anda Termasuk Anda Dengan Total ${el.quantity} Dikabari Juga, Silahkan Lihat Detail Lengkapnya`,
      notifTrip: true,
    }));

    await Promise.all([
      Tour.bulkWrite(concatValDate),
      Notification.insertMany(formatNotif),
    ]);
  }

  res.status(200).json({
    status: 'sucsess',
  });
});

export const getCategoriesTours = catchAsync(async (req, res, next) => {
  const categories = await CategoriesTour.find({
    typeCategories: 'destination',
  });

  res.status(200).json({
    data: categories,
  });
});

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

export const reqLocationGuide = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;

  const getGuide = await Guide.find({ tour: tourId });
  const formatNotif = getGuide?.map((el) => ({
    user: el.guides,
    tourId,
    message: 'Admin Meminta Lokasi Saat Ini , Segera Kirim Lokasi Rombongan',
    createdAt: Date.now(),
    isRead: false,
  }));

  await Notification.collection.insertMany(formatNotif);

  res.status(204).send();
});

export const getLineRoad = catchAsync(async (req, res, next) => {
  const { coordinates, coordsBus, idLocations } = req.body;

  const [lineLoc, lineBus] = await Promise.allSettled([
    coordinates && ApiCallOpenRouter(coordinates, false),
    coordsBus && ApiCallOpenRouter(coordsBus, true),
  ]);

  const handleFlipCoords = (val, getSegment) => {
    const line = val.features?.[0].geometry.coordinates.map(([lng, lat]) => [
      lat,
      lng,
    ]);
    const segment = getSegment && val.features?.[0].properties.segments?.[0];
    return { line, segment };
  };

  const coordinatesListLoc =
    lineLoc.status === 'fulfilled' &&
    lineLoc.value &&
    handleFlipCoords(lineLoc.value);

  const coordinatesBus =
    lineBus.status === 'fulfilled' &&
    lineBus.value &&
    handleFlipCoords(lineBus.value, true);

  res.status(200).json({
    status: 'sucsess',
    data: { coordinatesListLoc, coordinatesBus, idLocations },
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
