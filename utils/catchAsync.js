/**
 * Executes an asynchronous controller function
 * @param {Function} func controller function
 */
module.exports = func => {
  // will right away receive these parameters
  // when called and pass them to the 'func' function,
  // where it executes using them
  return (req, res, next) => {
    // err => next(err) is the same as just next, ES6 syntax REMEMBER
    func(req, res, next).catch(next); // next is needed for passing errors, when a rejection occurs
  };
};
