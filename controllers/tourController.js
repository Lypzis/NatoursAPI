//const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Just for test purposes
// file containing tours, reading the file outside for non-blocking reasons
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) // server will reload whenever this file gets modified
// ); // parsed to javascript object

// this middleware checks for valid ids,
// avoiding the check into each actual route
// and following the concept of DRY
// DEPRECATED, use mongoose model for checking
// exports.checkID = (req, res, next, val) => {
//   // in case an invalid id is entered, this is just temporary sanitization
//   if (req.params.id * 1 > tours.length - 1)
//     return res.status(404).send({
//       status: 'fail',
//       message: 'Invalid ID'
//     });

//   // might never get here in case of error
//   // otherwise, move on :D
//   next();
// };

// remember, it runs before sending
// the request to the route, if
// everything is ok, go to next in line :D
// DEPRECATED, use mongoose model for checking
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price)
//     return res.status(404).send({
//       status: 'fail',
//       message: 'Invalid parameters, missing name or price'
//     });

//   next();
// };

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

exports.getAllTours = catchAsync(async (req, res, next) => {
  //console.log(req.query);

  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query; // await for the query

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // populate will bring the guides documents along with the tour which references them
  // the select options with the '-' in front of the attributes will remove them from the result
  const tour = await Tour.findById(req.params.id).populate('reviews'); // check the tour model, for virtual populate

  // in case of no tour, immediately returns error
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });

  // TRANFERRED to function catchAsync, which does the same
  // thing but in a cleaner and DRY way, applies to all other
  // 'try catch' repetitions in this and other controllers
  // try {
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: 'Could not retrieve the tour.'
  //   });
  // }
});

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// REFACTORED TO ABOVE, as will all others
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   // in case of no tour, immediately returns error
//   if (!tour) return next(new AppError('No tour found with that ID', 404));

//   // case of delete, status is 204(no content), data is null
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

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
