import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import {
  DeleteReviewGuide,
  PostReviewGuide,
} from '../controller/controller_guideReview.js';

export const guideReviewRouter = express.Router();

guideReviewRouter.use(protect);
guideReviewRouter.route('/').post(accsess('user', 'admin'), PostReviewGuide);
guideReviewRouter
  .route('/:id')
  .delete(accsess('user', 'admin'), DeleteReviewGuide);
