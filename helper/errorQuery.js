class errorApp extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode === 500 ? 'Error' : 'Failed';
    this.IsOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default errorApp;
