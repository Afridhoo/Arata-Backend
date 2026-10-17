import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import {
  addValue,
  getAllValue,
  softDeleteOneById,
  updateOneById,
} from '../controller/controller_handler.js';
import { CategoriesTour } from '../models/model_categories.js';

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
