const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const { env } = process;

// JWT AUTHENTICATION TOKEN GENERATOR
// id - user id
const signToken = id => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN // expiration token time, set to 90 days in 'config.env'
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // INSECURE
  //const newUser = await User.create(req.body);

  // REPLACED BY, so only the data specified here is
  // going to get saved to the new user, and nothing more.
  // Now to set an admin, it is only possible manually at the database itself
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    name: name,
    email: email,
    password: password,
    passwordConfirm: passwordConfirm
  });

  // AUTHENTICATION TOKEN
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password)
    return next(new AppError('Please provide email and password!', 400)); // finishes right away in case of error

  // 2) Check if user exists and password is correct
  // finds the user(document) matching the email and brings his data, plus password, which will not be brought by default
  const user = await User.findOne({ email }).select('+password');

  // this is kind of inconvinient but it's safer than separating and error for both email and password
  // 'correctPassword'(check 'userModel') moved here, because if user does not exists, it will never reach this point
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  // 3) If everything ok, send token to client
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

// A middleware that is going to protect a route from unauthenticated access
exports.protect = catchAsync(async (req, res, next) => {
  // he protecc
  let token;

  // 1) Getting token and check if it's there, it is sent within the request header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1]; // token is after 'Bearer'
  //console.log(token);

  if (!token)
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, env.JWT_SECRET); // the header payload
  //console.log(decoded);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The token belonging to this user no loger exists.', 401)
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );

  // if all the steps above passed
  // ACCESS GRANTED TO THE PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// Since middleware only accept an specific set of
// params, an wrapper is necessary, as follows
exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide'] permitted, so if role='user' or something else, it gets rejected
    if (!roles.includes(req.user.role))
      //  req.user is defined above, and runs before this, so it can be used here
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user)
    return next(new AppError('There is no user with that email address.', 404));

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // this will now not pass through the validator of the schema

  // 3) Send it to user's email
});
exports.resetPassword = (req, res, next) => {};
