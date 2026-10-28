import express from 'express';

import {
  addValue,
  getAllValue,
  softDeleteOneById,
  updateOneById,
} from '../controller/controller_handler.js';
import { CategoriesTour } from '../models/model_categories.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

export const categoriesRouter = express.Router();

categoriesRouter
  .route('/')
  .post(protect, accsess('admin'), addValue(CategoriesTour))
  .get(getAllValue(CategoriesTour));

categoriesRouter.use(protect);
categoriesRouter
  .route('/:id')
  .patch(accsess('admin'), updateOneById(CategoriesTour))
  .delete(accsess('admin'), softDeleteOneById(CategoriesTour, 'inactive'));
