const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  // Turns obj keys into an array
  // then loop through it.
  // if a key is included in allowedFields
  // adds this 'obj' property to the 'newObj'.
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.'
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // // 1) Create error if user POSTs password data
  // "Cannot read property 'passwordConfirm' of undefined"
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );

  // 2) Filtered out unwanted fields,
  // making that only name and email are allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  // in this case 'findByIdAndUpdate' can be used because
  // there are fields that aren't necessary to be filled,
  // such as 'passwordConfirm'.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

// DO NOT update users password with this!
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User); // this should only be possible to an administrator
