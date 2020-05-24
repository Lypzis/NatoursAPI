// This class will be used for handling all errors throughout the app
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // from the extension class;
    this.statusCode = statusCode;
    // test status code starting number to give
    // one of the  error status
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // this marks that the error is coming from this class
    // meaning that its an operational error, not a development error
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
