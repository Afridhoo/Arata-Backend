const errDev = (res, err) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendResProd = (res, err, message) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: message,
  });
};

const errProd = (res, err) => {
  let messageErr;
  if (err?.errors && !err.errors?._id) {
    const errorObj = {
      error: Object.values(err.errors).map((el) => ({
        path: el.properties?.path,
        message: el.properties?.message,
      })),
    };

    messageErr = errorObj.error;
    return sendResProd(res, err, messageErr);
  }

  if (err.code === 11000) {
    // If the user updates or posts the same  thing
    const key = Object.keys(err.keyValue)[0];
    const value = Object.values(err.keyValue)[0].toString();
    messageErr = `Duplicate ${key} : ${value}`;
  } else if (err.name === 'ValidationError' && err.errors?._id) {
    // If User Insert or update inclueds Id
    messageErr = `Do not provide ID manually, it will be generated automatically`;
  } else if (err.name === 'CastError') {
    // ID Undefined
    messageErr = `invalid ${err.path} : ${err.value}`;
  } else if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError'
  ) {
    // Token Invalid
    messageErr = 'Please Log in Again';
  } else {
    // unknown Error
    messageErr = err.message;
  }

  sendResProd(res, err, messageErr);
};

const GlobalErrorMessage = (err, req, res, next) => {
  console.log(err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') errDev(res, err);
  else if (process.env.NODE_ENV === 'production') errProd(res, err);
};
export default GlobalErrorMessage;
