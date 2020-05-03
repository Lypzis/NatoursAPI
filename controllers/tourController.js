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
      message: 'Invalid data sent!' // temp error message
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
