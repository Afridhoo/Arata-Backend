import express from 'express';

import { getDocById, getDocumentationMe } from '../controller/private/documentation/docPrivate.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

export const documentationRouter = express.Router();

documentationRouter.use(protect);

documentationRouter
  .route('/getDocMe')
  .get(accsess('user', 'admin'), getDocumentationMe);

documentationRouter
  .route('/getDocMe/:id')
  .get(accsess('user', 'admin'), getDocById);
