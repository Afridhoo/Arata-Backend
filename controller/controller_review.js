import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';
import { Review } from '../models/model.review.js';

export const PostReview = catchAsync(async (req, res, next) => {
  const { booking, user } = req.body;
  const middlewareReq = req.user;

  const getReviewIsReady = await Review.findOne({ user, booking });

  if (getReviewIsReady) {
    if (getReviewIsReady.user.toString() !== middlewareReq._id.toString())
      return next(new errorApp('Tidak Bisa Memberikan Review', 400));

    await Review.findOneAndUpdate({ _id: getReviewIsReady._id }, req.body);
  } else await Review.create(req.body);

  res.status(200).json({
    status: 'sucsess',
  });
});
