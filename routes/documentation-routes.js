import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import {
  getDocById,
  getDocumentationMe,
} from '../controller/controller_documentation.js';

export const documentationRouter = express.Router();

documentationRouter.use(protect);

documentationRouter
  .route('/getDocMe')
  .get(accsess('user', 'admin'), getDocumentationMe);

documentationRouter
  .route('/getDocMe/:id')
  .get(accsess('user', 'admin'), getDocById);
