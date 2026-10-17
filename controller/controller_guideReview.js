import mongoose from 'mongoose';
import catchAsync from '../helper/catchAsync.js';
import { guideReview } from '../models/model_guideReview.js';
import { Booking } from '../models/model_booking.js';
import errorApp from '../helper/errorQuery.js';

export const PostReviewGuide = catchAsync(async (req, res, next) => {
  const value = req.body.value;
  const bookingId = value[0].booking;
  const middlewareReq = req.user;

  const getBooking = await Booking.findById(bookingId);
  const cheking = getBooking?.user.toString() !== middlewareReq._id.toString();

  if (cheking)
    return next(new errorApp('Tidak Bisa Mengupdate Review ini', 400));

  const getReviewGuide = await guideReview.find({ booking: bookingId });
  const getGuide = getReviewGuide?.map((el) => el.guide.toString());

  const getGuideIsReview = value?.filter((el) => getGuide.includes(el.guide));
  const getNewGuideReview = value?.filter((el) => !getGuide.includes(el.guide));

  if (getNewGuideReview.length > 0) {
    if (getNewGuideReview.length > 1) {
      await Promise.all(
        getNewGuideReview?.map(async (el) => guideReview.create(el)),
      );
    } else await guideReview.create(getNewGuideReview[0]);
  }

  if (getGuideIsReview.length > 0) {
    const getId = getGuideIsReview.map(
      (el) => new mongoose.Types.ObjectId(el.guide),
    );

    if (getGuideIsReview.length > 1)
      await Promise.all(
        getGuideIsReview?.map(async (el) =>
          guideReview.findOneAndUpdate(
            { guide: el.guide, booking: bookingId },
            el,
          ),
        ),
      );
    else
      await guideReview.findOneAndUpdate(
        { guide: getId[0], booking: bookingId },
        getGuideIsReview[0],
      );
  }

  res.status(200).json({
    status: 'sucsess',
  });
});

export const DeleteReviewGuide = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const middlewareReq = req.user;
  const [idGuide, idBooking] = id.split(',');

  await guideReview.findOneAndDelete({
    guide: idGuide,
    booking: idBooking,
    user: middlewareReq._id,
  });

  res.status(200).json({
    status: 'sucsess',
  });
});
