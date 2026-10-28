import mongoose from 'mongoose';
import catchAsync from '../../../../helper/catchAsync.js';
import { Booking } from '../../../../models/model_booking.js';
import { Notification } from '../../../../models/model_notification.js';
import { Tour } from '../../../../models/model_tour.js';
import { User } from '../../../../models/model_user.js';
import errorApp from '../../../../helper/errorQuery.js';

export const getUserBooking = catchAsync(async (req, res, next) => {
  const middlewareReq = req.user;

  const bookings = await Booking.find({ user: middlewareReq })
    .populate('tour', 'name  price imageCover summary')
    .populate('review')
    .populate('documentation', '_id -userBookingId');

  res.status(200).json({
    status: 'Sucsess',
    bookings,
  });
});

export const cancelBookingById = catchAsync(async (req, res, next) => {
  const middlewareReq = req.user;
  const { id } = req.params;

  const getBooking = await Booking.findById(id).populate('tour');
  const { _id: idUserHit } = middlewareReq;
  const {
    user: userBookingId,
    status,
    tour,
    quantity,
    _id: idBooking,
    bookingDate,
  } = getBooking;

  const { slot, name } = tour;
  const formatNotif = {
    booking: idBooking,
    user: idUserHit,
    message: `Pesanan Tour Anda Yang Di Pesan Pada Tanggal ${bookingDate} Dengan Nama ${name} Dengan Jumlah Pesanan ${quantity} Berhasil Anda Batalkan Pada Tanggal `,
  };

  if (idUserHit.toString() === userBookingId.toString()) {
    await Promise.all([
      Booking.findByIdAndUpdate(id, {
        status: 'cancelled',
        cancelAt: Date.now(),
      }),
      User.findByIdAndUpdate(idUserHit, {
        isActiveTrip: false,
      }),
      Notification.create(formatNotif),
    ]);

    if (status === 'confirmed')
      await Tour.findByIdAndUpdate(tour, { slot: slot + quantity });
  }

  res.status(200).json({
    status: 'Sucsess',
    message: 'Succsess Deleted Booking',
  });
});


export const oneBookingMe = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const middelwareReq = req.user;

  const getBooking = await Booking.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: 'tours',
        localField: 'tour',
        foreignField: '_id',
        as: 'dataTour',
      },
    },

    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'booking',
        as: 'getReview',
      },
    },

    {
      $project: {
        'dataTour.name': 1,
        'dataTour.imageCover': 1,
        'dataTour.startDates': 1,
        getReview: 1,
        'dataTour.locations': 1,
        totalPrice: 1,
        quantity: 1,
        payment: 1,
        status: 1,
        confirmAt: 1,
        dateFinished: 1,
        user: 1,
        bookingDate: 1,
      },
    },
  ]);

  if (middelwareReq._id.toString() !== getBooking?.[0].user?.toString())
    return next(new errorApp('Tidak Bisa Mengakses Url Ini !', 400));

  res.status(200).json({
    status: 'sucsess',
    data: getBooking?.[0],
  });
});
