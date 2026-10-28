import express from 'express';

import {
  addNewGuide,
  getSameGuide,
} from '../controller/private/guidePrivate/admin/guidePrivate.js';
import {
  deleteDocumentationGuide,
  deleteSkillGuide,
  getMeGuide,
  getTourGuides,
  UpdateDestinationHandle,
  updateDokumentationGuide,
  updateSkillGuide,
  UpdateUserBooking,
} from '../controller/private/guidePrivate/guide/guidePrivate.js';
import { uploadImageDocumentation } from '../helper/multer.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

export const guideRouter = express.Router();

guideRouter.use(protect);
guideRouter
  .route('/')
  .post(accsess('admin'), addNewGuide)
  .get(accsess('guide'), getMeGuide)
  .patch(accsess('guide'), UpdateUserBooking);
guideRouter.route('/addNewSkill').patch(accsess('guide'), updateSkillGuide);

guideRouter.route('/deleteOneSkill').patch(accsess('guide'), deleteSkillGuide);

guideRouter.route('/getTourGuides').get(accsess('guide'), getTourGuides);

guideRouter
  .route('/updateDestinationHandle')
  .post(accsess('guide'), uploadImageDocumentation, UpdateDestinationHandle);

guideRouter
  .route('/updateDocumentationGuide')
  .patch(accsess('guide'), uploadImageDocumentation, updateDokumentationGuide);

guideRouter
  .route('/deleteDocumentationGuide')
  .patch(accsess('guide'), deleteDocumentationGuide);

guideRouter
  .route('/getSameGuide')
  .post(accsess('guide', 'admin'), getSameGuide);
