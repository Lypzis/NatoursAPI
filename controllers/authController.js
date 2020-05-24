const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

const { env } = process;

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

  // JWT AUTHENTICATION TOKEN
  const token = jwt.sign({ id: newUser._id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN // expiration token time, set to 90 days in 'config.env'
  });

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});
