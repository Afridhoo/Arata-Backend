import express from 'express';
import {
  convertImage,
  convertImgUpdate,
  deleteLocationTour,
  deleteTour,
  getAllTour,
  getCategoriesTours,
  getDistanceLocTour,
  getFilterTour,
  getIsActiveTourTrip,
  getLineRoad,
  getLocationLatlng,
  getLocationSearch,
  getMonthlyPlan,
  getOneTour,
  getOneToursBooking,
  getTourDestination,
  getTourHomePage,
  getToursBooking,
  GetToursBookingStats,
  getTourStats,
  getToursWithin,
  insertLatlng,
  reqLocationGuide,
  updateDatesTour,
} from '../controller/controller_tour.js';
import { accsess, protect } from '../controller/controller_auth.js';
import { reviewRouter } from './review-routes.js';
import {
  addValue,
  getAllValue,
  updateOneById,
} from '../controller/controller_handler.js';
import { Tour } from '../models/model_tour.js';
import { bookingRouter } from './booking-routes.js';
import { uploadManyImage } from '../helper/multer.js';

export const RouteRouter = express.Router();

RouteRouter.use('/:tourId/review', reviewRouter);
RouteRouter.use('/:tourId/booking', bookingRouter);

RouteRouter.route('/top-5-tour').get(getFilterTour, getAllValue(Tour));
RouteRouter.route('/')
  .get(getAllTour)
  .post(
    protect,
    accsess('admin'),
    uploadManyImage,
    convertImage,
    addValue(Tour),
  );
RouteRouter.route('/tourHomePage').get(getTourHomePage);

RouteRouter.route('/tour-stats').get(getTourStats);

RouteRouter.route('/statsBookingTour').get(
  protect,
  accsess('admin'),
  GetToursBookingStats,
);

RouteRouter.route('/monthly-plan/:year').get(getMonthlyPlan);
RouteRouter.route('/tours-within/:distance/center/:latlng/unit/:unit').get(
  getToursWithin,
);
RouteRouter.route('/distances/:latlng/unit/:unit').get(getDistanceLocTour);

RouteRouter.route('/getLocation/:position').get(
  protect,
  accsess('admin'),
  insertLatlng('position'),
  getLocationLatlng,
);

RouteRouter.route('/getDestination/:destination').get(
  protect,
  accsess('admin'),
  insertLatlng('destination'),
  getTourDestination,
);

RouteRouter.route('/getToursBooking').get(
  protect,
  accsess('admin'),
  getToursBooking,
);
RouteRouter.route('/getGuideTour/:IdTour').get(
  protect,
  accsess('admin'),
  getOneToursBooking,
);

RouteRouter.route('/deleteLocation/:tour/location/:idlocation').delete(
  protect,
  accsess('admin'),
  deleteLocationTour,
);

RouteRouter.route('/getLocations/:search').get(
  protect,
  accsess('admin'),
  getLocationSearch,
);

RouteRouter.route('/updateDatesTour/:tourId').patch(
  protect,
  accsess('admin'),
  updateDatesTour,
);

RouteRouter.route('/getAllCategoriesTour').get(
  protect,
  accsess('guide'),
  getCategoriesTours,
);

RouteRouter.route('/getTourActiveTrip').get(
  protect,
  accsess('admin', 'guide'),
  getIsActiveTourTrip,
);

RouteRouter.route('/:id')
  .get(getOneTour)
  .patch(
    protect,
    accsess('admin'),
    uploadManyImage,
    convertImgUpdate,
    updateOneById(Tour),
  )
  .delete(protect, accsess('admin'), deleteTour);

RouteRouter.route('/reqLocationGuide/:tourId').get(
  protect,
  accsess('admin'),
  reqLocationGuide,
);

RouteRouter.route('/getLineOpenRouter').post(
  protect,
  accsess('admin', 'user'),
  getLineRoad,
);
