import express from 'express';

import { CreateFavorite } from '../controller/controller_favorite.js';
import { accsess, protect } from '../middleware/auth/authorization.js';

export const favoriteRouter = express.Router();

favoriteRouter.use(protect);

favoriteRouter.route('/').post(accsess('admin', 'user'), CreateFavorite);
