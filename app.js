const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// for Heroku secure header
app.enable('trust proxy');

// defines view engine, requires pug module installation;
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving static files
// static files in the public folder are accessible
// e.g.: http://localhost:3000/overview.html will open the overview page
app.use(express.static(path.join(__dirname, 'public')));

const { env } = process;

// MIDDLEWARES /////////////////////////

// Implement CORS
// Access-Control-Allow-Origin * (mean that it is allowed to all sites, it can be set to an specific though)
app.use(cors()); // add headers to allow cors
// to handle cors complex requests(like delete or patch), '*' allowed to all endpoints
app.options('*', cors());

// Set security HTTP headers
app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.6' })); // :DDDD

//3rd party middleware for development logging to console;
// which only occurs now when the
// environment is 'development'
if (env.NODE_ENV === 'development') app.use(morgan('dev'));

// Limit request from the same IP
// the below allows one hundred requests from the same ip in one hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter); // limiter will only affect routes starting with /api/.../...

// needs the body to be not in JSON, that's why it's placed here, before body parser
// OBS: express.raw can be used instead of body-parser, no need for installation
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body
// middleware, modifies incoming data
app.use(express.json({ limit: '10kb' })); // limits the body size to 10kb or less, higher than that won't be accepted

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cookieParser());

// Data sanitization against NoSQL Query Injection, e.g.: "email": { "$gt": ""} ...along with a known password
// allows to get logged in without any email.
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution. Cleans up unwanted query strings used in the route
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// custom middleware, next is a function proper to middlewares
// app.use((req, res, next) => {
//   //console.log('Hello from the middleware :D');

//   // this needs to be called for the code move on
//   // or it will be stuck in this
//   next();
// });

// compress text
app.use(compression());

// Test Middleware
app.use((req, res, next) => {
  // custom var given to the request
  req.requestTime = new Date().toISOString();

  //console.log(x); //testing uncaught exceptions

  //console.log(req.cookies);

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
const apiVersion = `/api/v1`;

app.use('/', viewRouter); // this is not part of API
app.use(`${apiVersion}/tours`, tourRouter);
app.use(`${apiVersion}/users`, userRouter);
app.use(`${apiVersion}/reviews`, reviewRouter);
app.use(`${apiVersion}/booking`, bookingRouter);

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
