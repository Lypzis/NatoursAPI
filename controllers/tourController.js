//const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

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

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Could not retrieve the tour.'
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({});
    // newTour.save();
    // but a better way: 'Tour.create({})' does both the above :D

    const newTour = await Tour.create(req.body);

    res.status(201).json({
      // 201 stands for created status
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err // temp error message
    });
  }
};

exports.updateTour = async (req, res) => {
  // An update is not actually implemented here,
  // it is just for show purposes
  try {
    // find by id and update its body parameters, duh :D
    // will work only with 'patch' requests, not put, since 'put' replaces the object
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }); // new here means that the newly updated document is returned

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    // case of delete, status is 204(no content), data is null
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

// almost like 'group by' remember?
exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

// analises each month for the given year
// it's a real problem solution
exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
