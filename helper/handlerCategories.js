import { CategoriesTour } from "../models/model_categories.js";
import catchAsync from "./catchAsync.js";

export const getCategoriesTours = catchAsync(async (req, res, next) => {
  const categories = await CategoriesTour.find({
    typeCategories: 'destination',
  });

  res.status(200).json({
    data: categories,
  });
});