const express = require('express');
const fs = require('fs');

const app = express();

// on get request to '/''
// app.get('/', (req, res) => {
//   // 200 = ok, just sending back a 'hello', right into the body
//   //res.status(200).send('Hello from the server side :D');

//   // sending back a json
//   res
//     .status(200) // 200 is default
//     .json({ message: 'Hello from the server side!', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.status(200).send('You can POST now :D');
// });

const apiVersion = '/api/v1';

const port = 3000;

// file containing tours, reading the file outside for non-blocking reasons
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
); // parsed to javascript object

// sends back tours data
app.get(`${apiVersion}/tours`, (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours
    }
  });
});

// starts the server listening;
app.listen(port, () => {
  console.log(`App running on port ${port}...`); // callback when starts listening
});
