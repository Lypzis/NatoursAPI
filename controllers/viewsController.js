const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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

exports.updateUserData = catchAsync(async (req, res, next) => {
  //const { name, email } = req.body; // the names given at the html body: account.pug

  const updatedUser = await User.findById(req.user.id);

  res.status(200).render('account', {
    title: 'My account',
    user: updatedUser
  });
});
