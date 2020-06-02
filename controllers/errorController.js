const AppError = require('../utils/appError');

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpireError = () =>
  new AppError('Your token has expired, Please log in again!', 401);

/**
 * Turns a mongoose 'CastError' error
 * into an human readable error when
 * in production
 * @param {Error} err an error
 */
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * Error thrown in case of duplicate names
 * @param {Error} err an error
 */
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

/**
 * Error thown in case of validation errors,
 * getting all of them and putting into one
 * single line of error message
 * @param {Error} err an error :D
 */
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}.`;

  return new AppError(message, 400);
};

// very detailed error if in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// less detailed error if in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational)
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  // Programming or other unknown error: don't leak error details
  // 1) Log error
  else console.error('ERROR', err);

  // 2) Send generic message
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!'
  });
};

// Global Middeaware function for error
// handling throughout the app
module.exports = (err, req, res, next) => {
  //console.log(err.stack); // stack trace shows where the error is happening

  err.statusCode = err.statusCode || '500'; // default is 500 (Internal server error)
  err.status = err.status || 'error'; // for the message status, default is 'error'

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // to avoid overwriting

    // rewrites the error to the client
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    if (error.name === 'TokenExpiredError') error = handleJWTExpireError();

    sendErrorProd(error, res);
  }

  next();
};
