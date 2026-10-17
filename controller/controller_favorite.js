import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';
import { Favorite } from '../models/model_favorite.js';

export const CreateFavorite = catchAsync(async (req, res, next) => {
  const { user, tour } = req.body;
  const middlewareReq = req.user;

  if (middlewareReq._id?.toString() !== user?.toString())
    return next(new errorApp('Gagal Melakukan Interkasi Dengan Favorite', 400));

  const getFavorite = await Favorite.exists({ user: user, tour: tour });

  if (getFavorite) await Favorite.deleteOne({ user: user, tour: tour });
  else await Favorite.create(req.body);

  res.status(200).send({
    status: 'sucsess',
    message: getFavorite ? 'Menghapus' : 'Menambah',
  });
});
