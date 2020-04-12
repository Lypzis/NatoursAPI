const fs = require('fs');

// file containing tours, reading the file outside for non-blocking reasons
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) // server will reload whenever this file gets modified
); // parsed to javascript object

// this middleware checks for valid ids,
// avoiding the check into each actual route
// and following the concept of DRY
exports.checkID = (req, res, next, val) => {
  // in case an invalid id is entered, this is just temporary sanitization
  if (req.params.id * 1 > tours.length - 1)
    return res.status(404).send({
      status: 'fail',
      message: 'Invalid ID',
    });

  // might never get here in case of error
  // otherwise, move on :D
  next();
};

// remember, it runs before sending
// the request to the route, if
// everything is ok, go to next in line :D
exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price)
    return res.status(404).send({
      status: 'fail',
      message: 'Invalid parameters, missing name or price',
    });

  next();
};

exports.getAllTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours: tours,
    },
  });
};

exports.getTour = (req, res) => {
  //console.log(req.params);
  const id = parseInt(req.params.id, 10); // or req.params.id * 1 :D
  const tour = tours.find((el) => el.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  //console.log(req.body); // needs middleware, to work
  const newId = tours[tours.length - 1].id + 1; // the last tour id plus 1
  const newTour = { id: newId, ...req.body }; // inserts variable within object

  tours.push(newTour); // insert new tour into "database"

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours), // needs to be converted back to string, remember
    (err) => {
      res.status(201).json({
        // 201 stands for created status
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  ); // write it donw asynchronously into the file
};

exports.updateTour = (req, res) => {
  // An update is not actually implemented here,
  // it is just for show purposes
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>',
    },
  });
};

exports.deleteTour = (req, res) => {
  // case of delete, status is 204(no content), data is null
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
