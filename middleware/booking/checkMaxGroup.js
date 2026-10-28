import catchAsync from "../../helper/catchAsync.js";
import errorApp from "../../helper/errorQuery.js";
import { Tour } from "../../models/model_tour.js";
import { User } from "../../models/model_user.js";

export const chekingMaxGroup = catchAsync(async (req, res, next) => {
  const middlewareReq = req.user;
  const { tour, quantity } = req.body;

  const [getTour, getUser] = await Promise.all([
    await Tour.findById(tour),
    await User.findById(middlewareReq._id),
  ]);

  const { soldOut, isActiveTripTour, slot } = getTour;

  if (soldOut || isActiveTripTour)
    return next(new errorApp('Slot Tour Sudah Penuh'));

  if (getUser.isActiveTrip) {
    return next(
      new errorApp(
        'Kamu Sudah Ada Pesanan Booking Aktif,Silahkan Batalkan Dulu ya',
        400,
      ),
    );
  } else
    await User.findByIdAndUpdate(middlewareReq._id, { isActiveTrip: true });

  if (quantity > slot) return next(new errorApp('Maximum Group Size', 400));

  next();
});

