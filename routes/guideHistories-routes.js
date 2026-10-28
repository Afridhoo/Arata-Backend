import express from 'express';

import {
  getHistoriesById,
  getHistoriesMe,
} from '../controller/controller_guideHistories.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

export const guideHistoriesRouter = express.Router();

guideHistoriesRouter.use(protect);
guideHistoriesRouter
  .route('/getGuideHistoriesMe')
  .get(accsess('guide'), getHistoriesMe);

guideHistoriesRouter
  .route('/getGuideHistoriesMe/:id')
  .get(accsess('guide', 'admin', 'user'), getHistoriesById);
