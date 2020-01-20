const express = require('express');
const fs = require('fs');

const app = express();

// middleware, modifies incoming data
app.use(express.json());

const apiVersion = '/api/v1';
const port = 3000;

// file containing tours, reading the file outside for non-blocking reasons
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`) // server will reload whenever this file gets modified
); // parsed to javascript object

const getAllTours = (req, res) =>
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours
    }
  });

const getTour = (req, res) => {
  //console.log(req.params);
  const id = parseInt(req.params.id); // or req.params.id * 1 :D
  const tour = tours.find(el => el.id === id);

  // in case an invalid id is entered, this is just temporary sanitization
  if (!tour)
    return res.status(404).send({
      status: 'fail',
      message: 'Invalid ID'
    });

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
};

const createTour = (req, res) => {
  //console.log(req.body); // needs middleware, to work
  const newId = tours[tours.length - 1].id + 1; // the last tour id plus 1
  const newTour = Object.assign({ id: newId }, req.body); // inserts variable within object

  tours.push(newTour); // insert new tour into "database"

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours), // needs to be converted back to string, remember
    err => {
      res.status(201).json({
        // 201 stands for created status
        status: 'success',
        data: {
          tour: newTour
        }
      });
    }
  ); // write it donw asynchronously into the file
};

const updateTour = (req, res) => {
  // in case an invalid id is entered, this is just temporary sanitization
  if (req.params.id * 1 > tours.length - 1)
    return res.status(404).send({
      status: 'fail',
      message: 'Invalid ID'
    });

  // An update is not actually implemented here,
  // it is just for show purposes
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here>'
    }
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length - 1)
    return res.status(404).send({
      status: 'fail',
      message: 'Invalid ID'
    });

  // case of delete, status is 204(no content), data is null
  res.status(204).json({
    status: 'success',
    data: null
  });
};

// EVENT HANDLERS /////////////////////////////

// sends back tours data to client
app.get(`${apiVersion}/tours`, getAllTours);

// ':id' the variable containing an id ... duh :D, the url can have multiple variables like this
// for an optional variable: ':duration?'
// the params are STRING, that is important to remember
app.get(`${apiVersion}/tours/:id/:duration?`, getTour);

// receives data from client
app.post(`${apiVersion}/tours`, createTour);

// for update data
app.patch(`${apiVersion}/tours/:id`, updateTour);

app.delete(`${apiVersion}/tours/:id`, deleteTour);

// starts the server listening;
app.listen(port, () => {
  console.log(`App running on port ${port}...`); // callback when starts listening
});
///////////////////////////////////////
