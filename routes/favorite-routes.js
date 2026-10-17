import express from 'express';
import { accsess, protect } from '../controller/controller_auth.js';
import { CreateFavorite } from '../controller/controller_favorite.js';

export const favoriteRouter = express.Router();

favoriteRouter.use(protect);

favoriteRouter.route('/').post(accsess('admin', 'user'), CreateFavorite);
