//const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.single('image') => req.file
// upload.array('images') => req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) // 3:2 ratio
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  //req.body.images = [];
  const imagesPromise = req.files.images.map(async (file, index) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

    await sharp(file.buffer)
      .resize(2000, 1333) // 3:2 ratio
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);

    return filename;
  });

  req.body.images = await Promise.all(imagesPromise);

  next();
});

// Just for test purposes
// file containing tours, reading the file outside for non-blocking reasons
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) // server will reload whenever this file gets modified
// ); // parsed to javascript object

// another middleware
// this one prefills query string
// givin an specific result, according
// to what I want to show in that specif route
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, 'reviews'); // or { path:'reviews' }

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// almost like 'group by' remember?
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 } //bring tours that match this
      }
    },
    {
      $group: {
        // the '_id' identifies by what should the groups be separated into
        //_id: '$ratingsAverage', // 'null' brings all tours
        _id: { $toUpper: '$difficulty' }, // 'null' brings all tours
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        avgPrice: 1 // will sort by one of the above attributes created, '1' is ASC
      }
    }
    // {
    //   $match: { // shows that match can be done multiple times
    //     _id: { $ne: 'EASY' }
    //   }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

// analises each month for the given year
// it's a real problem solution
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1; // * 1 parses the string to number, the year is expected to be 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //$unwind deconstructs docs and turns into one
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // january first, 2021 (first day of the year)
          $lte: new Date(`${year}-12-31`) // december 31, 2021 (last day of the year)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // grouping by the month wich are the matched startDates defined previously
        numTourStarts: { $sum: 1 }, // how many tours that month?
        tours: { $push: '$name' }, // tours will be an array($push) of the document's names for each month
        totalEarnings: { $sum: '$price' } // the sum of the total monthly prices, should it deduce discount(?)
      }
    },
    {
      $addFields: { month: '$_id' } // add a field :D in this case with the same values as '_id'
    },
    {
      $project: { _id: 0 } // 0 to hide, 1 to show; works for any field
    },
    {
      $sort: {
        numTourStarts: -1 // descending from the month with more tours
      }
    },
    {
      $limit: 12 // limits to 12 the output, NOT very usefull here
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  // miles or kilometers divided by the equivalent Earth's radius measure
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );

  const tours = await Tour.find({
    // mongoose geolocation query
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  // miles or kilometers
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );

  // in case of error about index, it may be necessary to create
  // it manually in the DB(using compass is the easyest way)
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        // since the result is in meters, this is necessary, it is the same as dividing by 1000
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
