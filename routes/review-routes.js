import express from 'express';

import {
  chekingSearch,
  deleteOneById,
  getAllValue,
  updateOneById,
} from '../controller/controller_handler.js';
import { Review } from '../models/model.review.js';
import { PostReview } from '../controller/controller_review.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

export const reviewRouter = express.Router({ mergeParams: true });

reviewRouter
  .route('/')
  .get(getAllValue(Review))
  .post(protect, accsess('user', 'admin'), PostReview);

reviewRouter
  .route('/:id')
  .delete(protect, chekingSearch(Review), deleteOneById(Review))
  .patch(protect, chekingSearch(Review), updateOneById(Review));
