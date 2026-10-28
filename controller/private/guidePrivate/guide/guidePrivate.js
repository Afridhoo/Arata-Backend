import catchAsync from '../../../../helper/catchAsync.js';
import { streamUpload } from '../../../../helper/cloudinary.js';
import errorApp from '../../../../helper/errorQuery.js';
import {
  Notification_Trip_Finish,
  Notification_Trip_OneLocationFinish,
} from '../../../../helper/handlerNotification.js';
import { handleOneObjMongoose } from '../../../../helper/handlerObjMongoose.js';
import { Booking } from '../../../../models/model_booking.js';
import { Documentation } from '../../../../models/model_dokumentation.js';
import { GuideHistory } from '../../../../models/model_guideHistory.js';
import { Guide } from '../../../../models/model_guides.js';
import { Tour } from '../../../../models/model_tour.js';
import { User } from '../../../../models/model_user.js';

export const getMeGuide = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;
  const guide = await Guide.findOne({ guides: middelwareReq._id });

  res.status(200).json({
    status: 'sucsess',
    data: guide,
  });
});

export const UpdateUserBooking = catchAsync(async (req, res, next) => {
  const { tourId, userBooking, userBookingId } = req.body;

  const [getGuideReady, checkIsDocIsReady] = await Promise.all([
    Guide.find({ tour: tourId }),
    Documentation.findOne({
      tour: tourId,
      statusDocumentation: 'ongoing',
    }),
  ]);

  const getIdGuide = getGuideReady?.map((el) => el._id);

  const formatDocumentation = {
    tour: tourId,
    guide: getIdGuide,
    userBooking,
    userBookingId,
    statusDocumentation: 'ongoing',
    startDate: Date.now(),
  };

  if (!checkIsDocIsReady) {
    await Promise.all([
      Documentation.create(formatDocumentation),
      Tour.findByIdAndUpdate(tourId, { isActiveTripTour: true }),
    ]);
  }
  if (checkIsDocIsReady) {
    const { _id } = checkIsDocIsReady;
    await Documentation.findByIdAndUpdate(_id, formatDocumentation);
  }

  res.status(204).json({
    status: 'sucsess',
  });
});

export const updateSkillGuide = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  await Guide.findOneAndUpdate(
    { guides: middelwareReq._id },
    { $addToSet: { skillGuide: { $each: req.body.skillGuide } } },
  );

  res.status(200).json({
    status: 'sucsess',
  });
});

export const deleteSkillGuide = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  const { idSkillDelete } = req.body;

  await Guide.findOneAndUpdate(
    { guides: middelwareReq._id },
    { $pull: { skillGuide: { $in: idSkillDelete } } },
  );

  res.status(200).json({
    status: 'sucsess',
  });
});

export const getTourGuides = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  const getValue = await Guide.aggregate([
    { $match: { guides: handleOneObjMongoose(middelwareReq._id) } },
    {
      $lookup: {
        from: 'tours',
        localField: 'tour',
        foreignField: '_id',
        as: 'tourHandle',
      },
    },

    {
      $lookup: {
        from: 'guides',
        localField: 'tour',
        foreignField: 'tour',
        as: 'sameGuide',
      },
    },

    {
      $lookup: {
        from: 'bookings',
        let: { idTour: '$tour' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$$idTour', '$tour'] },
              status: 'confirmed',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userBookingIdentity',
            },
          },
          { $unwind: '$userBookingIdentity' },
          {
            $project: {
              name: '$userBookingIdentity.name',
              telphone: '$userBookingIdentity.telphone',
              email: '$userBookingIdentity.email',
              photo: '$userBookingIdentity.photo',
              idUser: '$userBookingIdentity._id',
              quantity: 1,
              _id: 1,
            },
          },
        ],
        as: 'userBooking',
      },
    },

    { $unwind: '$tourHandle' },

    {
      $addFields: {
        categoriesListLocations: {
          $concatArrays: [
            '$tourHandle.locations.destination.categories',
            '$tourHandle.locations.hotel.categories',
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
      $lookup: {
        from: 'documentations',
        let: { idTour: '$tour' },
        pipeline: [
          {
            $match: {
              statusDocumentation: 'ongoing',
              $expr: { $eq: ['$$idTour', '$tour'] },
            },
          },
        ],
        as: 'documentationTour',
      },
    },

    {
      $addFields: {
        'tourHandle.totalBooking': {
          $subtract: ['$tourHandle.maxGroupSize', '$tourHandle.slot'],
        },
      },
    },

    {
      $addFields: {
        destinationHandle: {
          $filter: {
            input: '$tourHandle.locations.destination',
            as: 'dest',
            cond: {
              $in: ['$$dest._id', '$destinationHandle'],
            },
          },
        },
      },
    },

    {
      $project: {
        'tourHandle.name': 1,
        'tourHandle.startLocation.coordinates': 1,
        'tourHandle._id': 1,
        'tourHandle.totalBooking': 1,
        'tourHandle.locations.hotel': 1,
        'tourHandle.locations.destination': 1,
        documentationTour: 1,
        statusGuide: 1,
        destinationHandle: 1,
        'sameGuide._id': 1,
        dateAssigned: 1,
        GetCategories: 1,
        userBooking: 1,
        guides: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'sucsess',
    data: getValue,
  });
});

export const UpdateDestinationHandle = catchAsync(async (req, res, next) => {
  const files = req.files;

  const {
    idDestination,
    status,
    note,
    tourId,
    coordsMeAndDest,
    idUserBooking,
    GuideIdentityUploadDoc,
  } = req.body;

  const userId = JSON.parse(idUserBooking);

  const coordinatesNew = JSON.parse(coordsMeAndDest);
  const chekingCoords = coordinatesNew ? coordinatesNew : [];

  const checkStatsDoc = await Documentation.findOne({
    tour: tourId,
    statusDocumentation: 'ongoing',
  });

  if (!checkStatsDoc)
    return next(
      new errorApp(
        'Gagal Upload Dokumentasi , Wista Belum Ada , Silahkan Refresh Page Dan Jika Belum Mengabsen Rombongan Silahkan Absen Dulu',
      ),
    );

  const getTrip = checkStatsDoc?.trip?.filter(
    (e) => e.destination?.toString() === idDestination?.toString(),
  );
  const getLastUpdateTrip = getTrip?.[getTrip?.length - 1];
  if (getLastUpdateTrip?.statusHandle === 'finished')
    return next(
      new errorApp(
        'Status Wisata ini Sudah Finish Artinya Selesai , Jika Anda Ingin Mengupload Dokumentasi , Silahkan Edit Saja Atau Tambahkan Dokumentasi Nya ',
      ),
    );

  const [getTour, getAllGuideHandle, getBooking] = await Promise.all([
    Tour.findById(tourId),
    Guide.find({ tour: tourId }),
    Booking.find({ user: { $in: userId }, status: 'confirmed' }),
  ]);

  const { name, locations, maxGroupSize } = getTour;
  const { destination, hotel } = locations;
  const concatVal = [...destination, ...hotel];

  const removeStats = (val) =>
    val?.map((el) => ({
      ...el,
      dateFinished: null,
      status: 'pending',
      date: null,
    }));

  const getLocUpdate = concatVal.find(
    (el) => el._id.toString() === idDestination?.toString(),
  );
  const checkIsFinish = concatVal.filter(
    (el) => el.status === 'finished',
  ).length;

  const checkFinal = concatVal.length - checkIsFinish;
  const { typeLocation, date, description } = getLocUpdate;

  const imgDest = await Promise.all(
    files?.imageDocumentation?.map((el) => streamUpload(el.buffer)),
  );
  const getSecureUrl = (value) => value?.map((el) => el.secure_url);
  const getIdGuide = getAllGuideHandle?.map((el) => el._id);

  const formatDocumentation = [
    {
      destination: idDestination,
      statusHandle: status,
      note,
      images: getSecureUrl(imgDest),
      uploadAt: Date.now(),
      assigned_at: date?.from,
      completed_at: date?.to,
      groupLocation: chekingCoords[0],
      destinationLocation: chekingCoords[1],
      guideIdentityUpload: GuideIdentityUploadDoc,
    },
  ];

  async function handleUpdateStatus(fields) {
    await Tour.updateOne(
      { _id: tourId, [`locations.${fields}._id`]: idDestination },
      {
        $set: {
          [`locations.${fields}.$.status`]: status,
          [`locations.${fields}.$.dateFinished`]:
            status === 'finished' ? Date.now() : null,
        },
      },
    );
  }

  if (getAllGuideHandle?.length > 0 && status === 'finished') {
    const filterGuideByHandle = getAllGuideHandle.filter((el) =>
      el.destinationHandle.includes(idDestination),
    );

    const formatGuideHistory = filterGuideByHandle?.map((el) => ({
      guide: el.guides,
      tour: tourId,
      destination: idDestination,
      completedAt: Date.now(),
    }));

    await Promise.all(
      formatGuideHistory.map(async (el) => GuideHistory.create(el)),
      Notification_Trip_OneLocationFinish({
        value: { description },
        userBooking: getBooking,
      }),
    );
  }

  if (checkFinal === 1 && status === 'finished') {
    await Promise.all([
      Booking.updateMany(
        { user: { $in: userId }, status: 'confirmed' },
        { status: 'finished', dateFinished: Date.now() },
      ),
      Documentation.updateOne(
        { tour: tourId, statusDocumentation: 'ongoing' },
        {
          statusDocumentation: 'finished',
          $addToSet: { trip: formatDocumentation },
          guide: getIdGuide,
          finishedDate: Date.now(),
        },
      ),

      User.updateMany({ _id: { $in: userId } }, { isActiveTrip: false }),

      Notification_Trip_Finish({ value: { name }, userBooking: getBooking }),

      Guide.updateMany(
        { tour: tourId },
        {
          tour: null,
          destinationHandle: [],
          dateAssigned: null,
          statusGuide: 'ready',
        },
      ),
      Tour.findByIdAndUpdate(tourId, {
        isActiveTripTour: false,
        isBooking: false,
        soldOut: false,
        'locations.destination': removeStats(destination),
        'locations.hotel': removeStats(hotel),
        slot: maxGroupSize,
        'startLocation.date': null,
      }),
    ]);
  } else {
    if (typeLocation === 'destination') handleUpdateStatus('destination');
    if (typeLocation === 'hotel') handleUpdateStatus('hotel');
    await Promise.all([
      Guide.updateMany({ tour: tourId }, { $set: { statusGuide: 'ongoing' } }),
      Documentation.updateOne(
        { tour: tourId, statusDocumentation: 'ongoing' },
        { $addToSet: { trip: formatDocumentation }, guide: getIdGuide },
      ),
    ]);
  }

  res.status(200).json({
    status: 'sucsess',
  });
});

export const updateDokumentationGuide = catchAsync(async (req, res, next) => {
  const files = req.files;
  const { dataFormat, oldImage } = req.body;

  const data = JSON.parse(dataFormat);
  const oldImages = JSON.parse(oldImage);

  const imgDest =
    files.imageDocumentation &&
    (await Promise.all(
      files?.imageDocumentation?.map((el) => streamUpload(el.buffer)),
    ));

  const getSecureUrl = (value) => value?.map((el) => el.secure_url);

  const { idTrip, documentationId, trip } = data;
  const finalFormat = trip?.map((el) => ({
    ...el,
    uploadAt: Date.now(),
    images: [...(getSecureUrl(imgDest) || []), ...(oldImages || [])],
  }));

  const getDoc = await Documentation.exists({ _id: documentationId });
  if (!getDoc) return next(new errorApp('Dokumentasi Tidak Ada', 404));

  await Documentation.updateOne(
    {
      _id: handleOneObjMongoose(documentationId),
      'trip._id': handleOneObjMongoose(idTrip),
    },
    { $set: { 'trip.$': finalFormat } },
  );

  res.status(204).send();
});

export const deleteDocumentationGuide = catchAsync(async (req, res, next) => {
  const { idTrip, documentationId, idDestination } = req.body;

  const handleToString = (val) => val?.toString();

  const getDoc = await Documentation.findById(documentationId);
  if (!getDoc) return next(new errorApp('Gagal Menghapus Dokumentasi'));

  const { trip } = getDoc || [];
  const checkStatus = trip?.find(
    (e) => handleToString(e._id) === handleToString(idTrip),
  );

  const checkLength = trip?.filter(
    (e) => handleToString(e.destination) === handleToString(idDestination),
  );

  if (checkLength?.length <= 1)
    return next(
      new errorApp(
        'Setiap Perjalanan Wajib Memilki Setidaknya 1 , Silahkan Edit Gambar Yang  Ingin Anda Ubah',
      ),
    );

  const { statusHandle } = checkStatus;

  if (statusHandle === 'finished')
    return next(
      new errorApp(
        'Wisata ini Berstatus Finish , Guide Lain Mungkin Sudah Mengupdate Status Wisata Ini , Silahkan Refresh Page 😊',
        400,
      ),
    );

  await Documentation.updateOne(
    { _id: handleOneObjMongoose(documentationId) },
    { $pull: { trip: { _id: handleOneObjMongoose(idTrip) } } },
  );

  res.status(204).send();
});
