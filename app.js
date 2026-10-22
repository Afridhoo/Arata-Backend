import express from 'express';
import { RouteRouter } from './routes/tour-routes.js';
import morgan from 'morgan';
import errorApp from './helper/errorQuery.js';
import GlobalErrorMessage from './helper/GlobalErrorMessage.js';
import { userRouter } from './routes/user-routes.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { sanitize } from 'express-mongo-sanitize';
import hpp from 'hpp';
import { reviewRouter } from './routes/review-routes.js';
import cors from 'cors';
import { bookingRouter } from './routes/booking-routes.js';
import { notificationRouter } from './routes/notification-routes.js';
import { guideRouter } from './routes/guide-routes.js';
import { guideHistoriesRouter } from './routes/guideHistories-routes.js';
import { guideReviewRouter } from './routes/guideReview-routes.js';
import { favoriteRouter } from './routes/favorite-routes.js';
import { documentationRouter } from './routes/documentation-routes.js';
import { categoriesRouter } from './routes/categories-routes.js';
import cookieParser from 'cookie-parser';

export const app = express();

app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'to many request , please try again :)',
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(hpp());
app.use((req, res, next) => {
  if (req.body) {
    const body = sanitize({ ...req.body });
    req.body = body;
  }

  next();
});

app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
  }),
);

app.set('query parser', 'extended');

app.use('/api/v1/tours', RouteRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/notification', notificationRouter);
app.use('/api/v1/guide', guideRouter);
app.use('/api/v1/guideHistories', guideHistoriesRouter);
app.use('/api/v1/guideReview', guideReviewRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/api/v1/favorite', favoriteRouter);
app.use('/api/v1/documentation', documentationRouter);
app.use('/api/v1/categories', categoriesRouter);

app.all('*splat', (req, res, next) => {
  const err = new Error(`Undefined Url To ${req.originalUrl}`);
  next(new errorApp(err));
});

app.use(GlobalErrorMessage);
