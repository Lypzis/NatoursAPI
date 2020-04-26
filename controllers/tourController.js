//const fs = require('fs');
const Tour = require('../models/tourModel');

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

exports.getAllTours = async (req, res) => {
  try {
    // BUILD QUERY
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    // deletes fields that matches in the 'queryObj' keys
    excludedFields.forEach(el => delete queryObj[el]);

    // nice way of filtering :D
    // console.log(req.query);
    const query = Tour.find(queryObj); // without parameters, it returns everything;

    // The above is the easier way to use
    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // EXECUTE QUERY
    const tours = await query; // await for the query

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
      message: 'Could not retrieve the tours.'
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
