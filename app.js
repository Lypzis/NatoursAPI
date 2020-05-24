const express = require('express');

const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

const { env } = process;

// MIDDLEWARES /////////////////////////

//3rd party middleware for logging;
// which only occurs now when the
// environment is 'development'
if (env.NODE_ENV === 'development') app.use(morgan('dev'));

// middleware, modifies incoming data
app.use(express.json());

// static files in the public folder are accessible
// e.g.: http://localhost:3000/overview.html will open the overview page
app.use(express.static(`${__dirname}/public`));

// custom middleware, next is a function proper to middlewares
// app.use((req, res, next) => {
//   //console.log('Hello from the middleware :D');

//   // this needs to be called for the code move on
//   // or it will be stuck in this
//   next();
// });

app.use((req, res, next) => {
  // custom var given to the request
  req.requestTime = new Date().toISOString();

  next();
});
/////////////////////////////////////////

// ROUTE HANDLERS /////////////////////////////

// old way
// app.get(`${apiVersion}/tours`, getAllTours);
// app.post(`${apiVersion}/tours`, createTour);
// app.patch(`${apiVersion}/tours/:id`, updateTour);
// app.delete(`${apiVersion}/tours/:id`, deleteTour);
// app.get(`${apiVersion}/tours/:id/:duration?`, getTour);
// ':id' the variable containing an id ... duh :D, the url can have multiple variables like this
// for an optional variable: ':duration?'
// the params are STRING, that is important to remember

// ROUTES
const apiVersion = '/api/v1';

app.use(`${apiVersion}/tours`, tourRouter);
app.use(`${apiVersion}/users`, userRouter);

// this middleware will handle all unexistent routes
// it will arrive here if none of the previous
// routes match the url request
// ALWAYS place this after all the other routes
app.all('*', (req, res, next) => {
  // simulation
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // next only receives errors, so it will actually assumes that it is one being passed
  // and will yeet it to the next middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ERROR HANDLING MIDDLEWARE
// error handling middlewares have 4 arguments, which express automatically awknoledges
app.use(globalErrorHandler);

module.exports = app;
