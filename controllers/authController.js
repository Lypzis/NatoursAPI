const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const { env } = process;

// JWT AUTHENTICATION TOKEN GENERATOR
// id - user id
const signToken = id => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN // expiration token time, set to 90 days in 'config.env'
  });
};

const createSendToken = (user, statusCode, res) => {
  // AUTHENTICATION TOKEN
  const token = signToken(user._id);

  // cookie config
  const cookieOptions = {
    expires: new Date(
      Date.now() + env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // day converted to milliseconds
    ),
    secure: env.NODE_ENV === 'production', // only true in production, where https is enabled
    httpOnly: true
  };

  // Removes password from output, because it is
  // being sent along to client on creation
  user.password = undefined;

  // cookie
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // INSECURE
  //const newUser = await User.create(req.body);

  // REPLACED BY, so only the data specified here is
  // going to get saved to the new user, and nothing more.
  // Now to set an admin, it is only possible manually at the database itself
  const { name, email, password, passwordConfirm, role } = req.body;
  const newUser = await User.create({
    name: name,
    email: email,
    password: password,
    passwordConfirm: passwordConfirm,
    role: role
  });

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
});

// LOGOUT ... super secure token
// set the token to an invalid one, immediatelly login out the user
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};

// A middleware that is going to protect a route from unauthenticated access
exports.protect = catchAsync(async (req, res, next) => {
  // he protecc
  let token;

  // 1) Getting token and check if it's there, it is sent within the request header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];
  // token is after 'Bearer'
  else if (req.cookies.jwt) token = req.cookies.jwt;
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
  res.locals.user = currentUser; // to be able to use it at templates
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  // on rendered pages, token is only available as a cookie
  if (req.cookies.jwt) {
    try {
      // 1) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) return next();

      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

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
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password with your new password and
  passwordConfirm to: ${resetURL}. \nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email, // or just email, since it is being destructured from req.body.email
      subject: 'Your Password Reset Token(valid for 10 minutes)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!' // from there it is safe to reset it(assuming only the user has access to it :D)
    });
  } catch (err) {
    // in case of an error, invalidate the token and expiration right away
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token.
  const hashedtoken = crypto
    .createHash('sha256')
    .update(req.params.token) // token comes from the '/:token'
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedtoken,
    passwordResetExpires: { $gt: Date.now() } // if it is not greater, than it is expired
  });

  // 2) If token has not expired, and there is user, set the new password.
  if (!user) return next(new AppError('Token is invalid or has expired!', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changePasswordAt property for the user.
  // look into userModel.js pre middleware

  // 4) Log the user in, send JWT.
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, newPasswordConfirm } = req.body;

  if (!password)
    return next(new AppError('Please input your current password!', 400));

  if (!newPassword || !newPasswordConfirm)
    return next(
      new AppError('Please provide your new password and confirm it!', 400)
    );

  // 1) Get user from collection
  // this need to pass throug protect(only the logged in user can do this :D),
  // which will then make req.user.id available
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect password, please try again!', 401));

  // 3) If so, update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
