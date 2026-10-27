import { Guide } from '../models/model_guides.js';
import errorApp from './errorQuery.js';
import { handleObjMongoose } from './handlerObjMongoose.js';

export async function RemoveGuideFromTask({ idDeleteGuide = [], next }) {
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

export async function AssignedGuideToTask({ getFinalGuide = [], tourId }) {
  const formatBulkWriteGuide = getFinalGuide.map((el) => ({
    updateOne: {
      filter: { _id: el._id, statusGuide: { $in: ['pending', 'ready'] } },
      update: {
        $set: {
          tour: tourId,
          destinationHandle: handleObjMongoose(el.destination),

          statusGuide: 'pending',
          dateAssigned: Date.now(),
        },
      },
    },
  }));

  await Guide.bulkWrite(formatBulkWriteGuide);
}
