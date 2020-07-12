const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// DEPRECATED by the use of Sharp package
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users');
//   },
//   filename: (req, file, callback) => {
//     // user-7747673-3322323.jpeg
//     const ext = file.mimetype.split('/')[1];
//     callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage(); // stored as a buffer

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) callback(null, true);
  else
    callback(
      new AppError('Not an image! Please upload only images.', 400),
      false
    );
};

// upload images into the file system, not the database, never in database
// at database, just the link to the image.(req, file, callback)
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // image buffer is read here
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

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

// this middleware will translate the incoming 'req.user.id'
// from the protected route to 'req.params.id' which is used in getOne
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
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
  // if there is a file(photo), append it to the object, so it's updated as well
  if (req.file) filteredBody.photo = req.file.filename;

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
