import mongoose from 'mongoose';
import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';
import { Booking } from '../models/model_booking.js';
import { Notification } from '../models/model_notification.js';
import { Tour } from '../models/model_tour.js';
import { User } from '../models/model_user.js';

export const getAllValueBooking = catchAsync(async (req, res, next) => {
  const { page: limit, status, totals, date, group, name } = req.query || {};

  const page = Math.max(Number(limit) || 1, 1);
  const limits = 10;

  const sort = {};
  const match = {};
  const matchSearch = {};

  if (name) {
    matchSearch['searchUser'] = {
      $or: [
        { name: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } },
        { telphone: { $regex: name, $options: 'i' } },
      ],
    };
  } else {
    matchSearch.searchUser = {};
    matchSearch.name = {};
  }

  

  function handleSorts(value, key) {
    if (!value) {
      sort.createAt = -1;
      return {};
    }

    const split = value?.split('');
    const getIdx = split.findIndex((s) => s === '+' || s === '-');
    const opeartor = split[getIdx] === '-' ? '-1' : '+1';

    if (split) sort[key] = Number(opeartor);
  }

  if (status) {
    handleSorts(status, 'status');
    match.status = status.split(sort.status)[0];
  }
  handleSorts(totals, 'totalPrice');
  handleSorts(date, 'bookingDate');
  handleSorts(group, 'quantity');

  const bookings = await Booking.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$user' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$$userId', '$_id'] },
            },
          },

          { $match: matchSearch.searchUser },

          {
            $project: {
              role: 1,
              email: 1,
              telphone: 1,
              name: 1,
            },
          },
        ],
        as: 'user',
      },
    },
   

    { $unwind: '$user' },

    {
      $lookup: {
        from: 'tours',
        let: { idTour: '$tour' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$$idTour', '$_id'] },
            },
          },

          {
            $project: {
              name: 1,
              price: 1,
            },
          },
        ],
        as: 'tour',
      },
    },

    { $unwind: '$tour' },

    { $sort: sort },
    { $skip: (page - 1) * limits },
    { $limit: limits },
  ]);

  res.status(200).json({
    status: 'sucsess',
    messsage: 'Sucsess To Get Data',

    data: {
      bookings,
    },
  });
});

export const getRevenueBooking = catchAsync(async (req, res, next) => {
  const pendingCount = await Booking.countDocuments({ status: 'pending' });
  const confirmedCount = await Booking.countDocuments({ status: 'confirmed' });
  const cancelledCount = await Booking.countDocuments({ status: 'cancelled' });
  const finishedCount = await Booking.countDocuments({ status: 'finished' });

  const getRevenue = await Booking.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  const totalBooking = await Booking.countDocuments();

  res.status(200).json({
    status: 'sucsess',
    data: {
      pendingBooking: pendingCount || 0,
      confirmedBooking: confirmedCount || 0,
      cancelledBooking: cancelledCount || 0,
      finishedBooking: finishedCount || 0,
      revenueBooking: getRevenue[0]?.total || 0,
      totalBooking: totalBooking,
    },
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
    message: `Pesanan Tour Anda Yang Di Pesan Pada Tanggal ${bookingDate} Dengan Nama ${name} Dengan Jumlah Pesanan ${quantity} Berhasil Anda Batalkan Pada Tanggal ${Date.now()}`,
  };

  if (idUserHit.toString() === userBookingId.toString()) {
    await Promise.all([
      await Booking.findByIdAndUpdate(id, {
        status: 'cancelled',
        cancelAt: Date.now(),
      }),
      await User.findByIdAndUpdate(idUserHit, {
        isActiveTrip: false,
      }),
      await Notification.create(formatNotif),
    ]);

    if (status === 'confirmed') {
      await Tour.findByIdAndUpdate(tour, {
        slot: slot + quantity,
      });
    }
  }

  res.status(200).json({
    status: 'Sucsess',
    message: 'Succsess Deleted Booking',
  });
});

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

export const updateBooking = catchAsync(async (req, res, next) => {
  const { id: bookingId } = req.params;
  const { status, tourId } = req.body.value;

  const [getBookingUpdate, getTour] = await Promise.all([
    await Booking.findById(bookingId),
    await Tour.findById(tourId).populate('booking'),
  ]);

  const { quantity, user, payment, bookingDate } = getBookingUpdate;
  const { booking, maxGroupSize, name, slot } = getTour;

  const getAllQty = booking
    ?.filter((el) => el.status === 'confirmed')
    ?.reduce((acc, cur) => acc + cur.quantity, 0);
  const totalsAllBooking = getAllQty + quantity;

  if (totalsAllBooking > maxGroupSize)
    return next(
      new errorApp('Quantity Melebihi Batas,Booking Tidak Bisa Di Konfirmasi'),
    );

  if (totalsAllBooking === maxGroupSize)
    await Tour.findByIdAndUpdate(tourId, {
      soldOut: true,
    });

  const formatNotif = {
    booking: bookingId,
    user,
    message: `Booking Yang Di Pesan Pada Tanggal ${bookingDate} Dengan Nama Tour ${name} Pembayaran ${payment}, Sudah Di Konfirmasi , Dengan Total Pesanan ${quantity} Orang `,
  };
  if (status === 'confirmed') {
    await Promise.all([
      await Notification.create(formatNotif),
      await Tour.findByIdAndUpdate(tourId, {
        slot: slot - quantity,
        isBooking: true,
      }),
      await Booking.findByIdAndUpdate(bookingId, {
        status: status,
        confirmAt: Date.now(),
      }),
    ]);
  }

  res.status(200).json({
    status: 'Sucsess',
  });
});

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
