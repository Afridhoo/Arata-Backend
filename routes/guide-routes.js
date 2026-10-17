import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import {
  addNewGuide,
  deleteDocumentationGuide,
  deleteSkillGuide,
  getDestinationHandle,
  getMeGuide,
  getSameGuide,
  getTourGuides,
  UpdateDestinationHandle,
  updateDokumentationGuide,
  updateSkillGuide,
  UpdateUserBooking,
} from '../controller/controller_guide.js';
import { uploadImageDocumentation } from '../helper/multer.js';

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
  .route('/getDestinationHandle/:idTour/:idDestination')
  .get(accsess('guide'), getDestinationHandle);

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
