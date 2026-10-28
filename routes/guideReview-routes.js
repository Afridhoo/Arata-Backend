import express from 'express';
;
import {
  DeleteReviewGuide,
  PostReviewGuide,
} from '../controller/controller_guideReview.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

export const guideReviewRouter = express.Router();

guideReviewRouter.use(protect);
guideReviewRouter.route('/').post(accsess('user', 'admin'), PostReviewGuide);
guideReviewRouter
  .route('/:id')
  .delete(accsess('user', 'admin'), DeleteReviewGuide);
