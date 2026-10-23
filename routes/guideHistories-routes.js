import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import {
  getHistoriesById,
  getHistoriesMe,
} from '../controller/controller_guideHistories.js';

export const guideHistoriesRouter = express.Router();

guideHistoriesRouter.use(protect);
guideHistoriesRouter
  .route('/getGuideHistoriesMe')
  .get(accsess('guide'), getHistoriesMe);

guideHistoriesRouter
  .route('/getGuideHistoriesMe/:id')
  .get(accsess('guide', 'admin', 'user'), getHistoriesById);
