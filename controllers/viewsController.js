const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;

  // This alert can also be used all over the other places
  if (alert === 'booking')
    res.locals.alert = `Your booking was successful! Please check your email for a confirmation.
      If your booking doesn't show up here immediately, please come back later.`;

  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get the data, for the requested tour (including reviews and guides) //populate only reviews
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review  rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with name.', 404));
  }

  // 2) Build template

  // 3) Render template using data from 1)
  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My account'
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find the tours with the returned IDs
  const tourIDs = bookings.map(booking => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } }); // select all tours that have tour ids in the array 'tourIDs'

  // since overview shows tours, it can be reused here to show just the ones selected
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  //const { name, email } = req.body; // the names given at the html body: account.pug

  const updatedUser = await User.findById(req.user.id);

  res.status(200).render('account', {
    title: 'My account',
    user: updatedUser
  });
});
