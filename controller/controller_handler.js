import catchAsync from '../helper/catchAsync.js';
import errorApp from '../helper/errorQuery.js';
import ApiFeatures from '../helper/filterQuery.js';

export const getAllValue = (model) =>
  catchAsync(async (req, res, next) => {
    let getParams = {};
    if (req.params.tourId) getParams.tour = req.params.tourId;

    const features = new ApiFeatures(model.find(getParams), req.query)
      .filter()
      .sort()
      .fields()
      .page();

    const value = await features.query;

    if (!value) return next(new errorApp('invalid Get Value.', 400));

    res.status(200).json({
      status: 'sucsess',
      messsage: 'Sucsess To Get Data',
      data: value.length === 0 ? [] : { value },
    });
  });

export const addValue = (model) =>
  catchAsync(async (req, res, next) => {
    const value = await model.create(req.body);

    if (!value) return next(new errorApp('invalid Add New Value.', 400));

    res.status(200).json({
      status: 'sucsess',
      data: {
        value,
      },
    });
  });

export const updateOneById = (model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const value = await model.findByIdAndUpdate(id, req.body);
    if (!value) return next(new errorApp('invalid Update.', 400));

    res.status(200).json({
      status: 'sucsess',
      data: {
        value,
      },
    });
  });

export const getOneById = (model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const url = req.baseUrl.split('/')[3];
    let prossValue;

    if (url === 'tours')
      prossValue = model.findById(id).populate([{ path: 'review' }]);
    else if (url === 'booking') {
      prossValue = model.findById(id).populate([
        {
          path: 'tour',
          select:
            'name photo price imageCover startDates slot maxGroupSize locations ',
        },
        {
          path: 'user',
          select: 'name email telphone',
        },
      ]);
    } else prossValue = model.findById(id);

    if (!prossValue) return next(new errorApp('invalid query.', 400));
    const value = await prossValue;

    res.status(200).json({
      status: 'sucsess',
      data: {
        value,
      },
    });
  });

export const deleteOneById = (model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new errorApp('invalid query.', 400));
    await model.findByIdAndDelete(id);

    res.status(204).send();
  });

export const softDeleteOneById = (model, valueNonActive) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id || !valueNonActive)
      return next(
        new errorApp(
          'Please Check Again Params Or InActive Values Name In Your Schema',
          400,
        ),
      );

    await model.findByIdAndUpdate(id, { status: valueNonActive });

    res.status(204).send();
  });

export const chekingSearch = (model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const middelwareUser = req.user;
    const value = await model.findById(id);
    const method = req.method;

    if (!value) return next(new errorApp('invalid query.', 400));

    const chekingUser =
      value?.user?.toString() !== middelwareUser._id?.toString();

    if (chekingUser) return next(new errorApp('Invalid Query'), 400);

    if (method === 'GET')
      if (middelwareUser.role !== 'admin' && value.role === 'admin') {
        return next(new errorApp('invalid Search.', 400));
      }

    next();
  });

export const insertParams = (req, res, next) => {
  const tourId = req.params.tourId;
  const messageNotif = req.body.message;
  const idBooking = req.params.bookingId;

  if (messageNotif) req.body.message = messageNotif;
  if (idBooking) req.body.booking = idBooking;
  if (tourId) req.body.tour = tourId;

  req.body.user = req.user._id;

  next();
};

export function handleSorts({ value, key, sorts }) {
  if (!value) return {};
  const validDate = value?.split('');
  const getIdx = validDate.findIndex((s) => s === '-' || s === '+');

  const checkOperator = validDate[getIdx] === '-' ? -1 : 1;

  if (getIdx >= 0) sorts[key] = checkOperator;
}
