//const fs = require('fs');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

  console.log(distance, latlng, unit);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});
