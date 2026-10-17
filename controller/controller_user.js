import { User } from '../models/model_user.js';
import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';
import { sendToken } from '../helper/tokenHelper.js';
import { filterValue } from '../helper/fiilterValue.js';
import { Booking } from '../models/model_booking.js';
import { Review } from '../models/model.review.js';
import { streamUpload } from '../helper/cloudinary.js';
import { Tour } from '../models/model_tour.js';
import { guideReview } from '../models/model_guideReview.js';
import { Favorite } from '../models/model_favorite.js';
import { GuideHistory } from '../models/model_guideHistory.js';

export const deleteUser = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;
  await User.findByIdAndUpdate(middelwareReq._id, { active: false });

  res.status(204).send();
});

export const convertImageUser = catchAsync(async (req, res, next) => {
  const file = req.file;

  if (file) {
    const resultPhoto = await streamUpload(file.buffer);

    req.body.photo = resultPhoto.secure_url;
  } else req.body.photo = undefined;

  next();
});

export const updateUser = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  if (req.body.password || req.body.confirmPassword)
    return next(new errorApp('Please do not change the password here'), 400);

  const valueFilter = ['name', 'email', 'photo', 'telphone'];
  const correctValue = filterValue(req.body, valueFilter);

  const user = await User.findByIdAndUpdate(middelwareReq._id, correctValue, {
    runValidators: true,
    returnDocument: 'after',
  });

  sendToken(res, user);
});

export const getAccountMe = catchAsync(async (req, res, next) => {
  const { id } = req.user;



  const value = await User.findById(id);

  res.status(200).json({
    status: 'sucsess',
    data: {
      value,
    },
  });
});

export const getStatsMe = catchAsync(async (req, res, next) => {
  const [booking, review, guideReviews, favorite, getGuideHandle] =
    await Promise.all([
      Booking.countDocuments({ user: req.user }),
      Review.countDocuments({ user: req.user }),
      guideReview.countDocuments({
        $or: [{ user: req.user }, { guide: req.user }],
      }),
      Favorite.countDocuments({ user: req.user }),

      req.user.role === 'guide' &&
        GuideHistory.countDocuments({ guide: req.user._id }),
    ]);

  res.status(200).json({
    status: 'sucsess',
    dataResult: {
      booking: booking,
      review: review,
      guideReview: guideReviews,
      favorite: favorite,
      getGuideHandle: getGuideHandle,
    },
  });
});

export const findUserBy = catchAsync(async (req, res, next) => {
  const { searchValue } = req.params;

  const user = await User.find({
    $or: [
      { name: { $regex: searchValue, $options: 'i' } },
      { email: { $regex: searchValue, $options: 'i' } },
      { role: { $regex: searchValue, $options: 'i' } },
    ],
  });

  if (!user) return next(new errorApp('User Tidak Di Temukan'));

  res.status(200).json({
    status: 'sucsess',
    data: user,
  });
});

export const getTrip = catchAsync(async (req, res, next) => {
  const middelwareReq = req.user;

  const getBooking = await Booking.findOne({
    user: middelwareReq?._id,
    status: 'confirmed',
  });

  const [getReview, getGuideReview, getTourTrip] = await Promise.all([
    Review.find({ booking: getBooking?._id }),
    guideReview.find({ booking: getBooking?._id }),
    Tour.aggregate([
      { $match: { _id: getBooking?.tour } },
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
          from: 'users',
          localField: 'documentation.userBooking.userId',
          foreignField: '_id',
          as: 'userBookingIdentity',
        },
      },

      {
        $lookup: {
          from: 'guides',
          localField: 'documentation.guide',
          foreignField: '_id',
          as: 'guideHandle',
        },
      },

      {
        $lookup: {
          from: 'users',
          let: { idGuide: '$guideHandle.guides' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$idGuide'] } } },
            { $project: { name: 1, photo: 1, telphone: 1, email: 1 } },

            {
              $project: {
                name: 1,
                photo: 1,
                email: 1,
                telphone: 1,
              },
            },
          ],

          as: 'guideIdentity',
        },
      },

      {
        $addFields: {
          'locations.destination': {
            $map: {
              input: '$locations.destination',
              as: 'loc',
              in: {
                $mergeObjects: [
                  '$$loc',
                  {
                    guideReady: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$guideHandle',
                            as: 'guide',
                            cond: {
                              $in: [
                                '$$loc._id',
                                {
                                  $ifNull: ['$$guide.destinationHandle', []],
                                },
                              ],
                            },
                          },
                        },
                        as: 'el',
                        in: {
                          $mergeObjects: [
                            '$$el',
                            {
                              identity: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: '$guideIdentity',
                                      as: 'i',
                                      cond: { $eq: ['$$i._id', '$$el.guides'] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
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

      { $addFields: { checkDoc: { $size: '$documentation' } } },

      {
        $unwind: {
          path: '$documentation',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          dataBoking: {
            $map: {
              input: '$documentation.userBooking',
              as: 'doc',
              in: {
                $mergeObjects: [
                  '$$doc',
                  {
                    dataUser: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$userBookingIdentity',
                            as: 'userIdentity',
                            cond: {
                              $eq: ['$$doc.userId', '$$userIdentity._id'],
                            },
                          },
                        },
                        0,
                      ],
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
          name: 1,
          maxGroupSize: 1,
          bookedCount: 1,
          categories: 1,
          slot: 1,
          'documentation.trip': 1,
          imageCover: 1,
          locations: 1,
          duration: 1,
          checkDoc: 1,
          isActiveTripTour: 1,
          startLocation: 1,
          'dataBoking.dataUser.name': 1,
          'dataBoking.dataUser.telphone': 1,
          'dataBoking.dataUser.photo': 1,
          'dataBoking.statusUserBooking': 1,
          'dataBoking.totalUserCompleted': 1,
          'dataBoking.totalUserIncompleted': 1,
          idBooking: getBooking?._id,
        },
      },
    ]),
  ]);

  res.status(200).json({
    staus: 'sucsess',
    data: getBooking ? { getReview, getTourTrip, getGuideReview } : [],
  });
});

export const getUserAndBooking = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const getUser = await User.find({ _id: userId.split(',') });

  res.status(200).json({
    status: 'sucsess',
    data: getUser,
  });
});
