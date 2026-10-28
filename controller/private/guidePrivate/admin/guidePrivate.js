import catchAsync from '../../../../helper/catchAsync.js';
import errorApp from '../../../../helper/errorQuery.js';
import { handleObjMongoose } from '../../../../helper/handlerObjMongoose.js';
import { Guide } from '../../../../models/model_guides.js';
import { User } from '../../../../models/model_user.js';

export const addNewGuide = catchAsync(async (req, res, next) => {
  const { id, newRole } = req.body;

  const getUser = await User.findById(id);
  if (!getUser) return next(new errorApp('User Tidak Di Temukan'));

  const { role, name } = getUser;
  if (newRole === role)
    return next(
      new errorApp(
        `User Dengan Nama ${name} Sudah Memiliki Role ${newRole}`,
        400,
      ),
    );

  if (newRole === 'guide')
    await Guide.create({ guides: id, assignedAt: Date.now() });
  else await User.findByIdAndUpdate(id, { role: newRole });

  res.status(200).json({
    status: 'sucsess',
  });
});

export const getSameGuide = catchAsync(async (req, res, next) => {
  const { value } = req.body;
  const { idUserBooking, guide } = value;

  const idUser = handleObjMongoose(idUserBooking);
  const idGuide = handleObjMongoose(guide);

  const [getUsers, getGuides] = await Promise.allSettled([
    User.find({ _id: idUser }),
    Guide.aggregate([
      { $match: { _id: { $in: idGuide } } },

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
          from: 'users',
          localField: 'guides',
          foreignField: '_id',
          as: 'guideIdentity',
        },
      },

      { $unwind: '$getTour' },

      {
        $addFields: {
          destHandle: {
            $filter: {
              input: '$getTour.locations.destination',
              cond: {
                $in: ['$$this._id', '$destinationHandle'],
              },
            },
          },
        },
      },

      { $unwind: '$guideIdentity' },

      {
        $project: {
          destHandle: 1,
          'guideIdentity.name': 1,
          'guideIdentity.email': 1,
          'guideIdentity.photo': 1,
          'guideIdentity.telphone': 1,
          'guideIdentity._id': 1,
        },
      },
    ]),
  ]);

  const finalValue = { getUser: [], getGuide: [] };

  const cheking = (val) => val.status === 'fulfilled' && val.value.length > 0;

  if (cheking(getUsers)) finalValue.getUser = getUsers.value;
  if (cheking(getGuides)) finalValue.getGuide = getGuides.value;

  res.status(200).json({
    status: 'sucsess',
    data: finalValue,
  });
});
