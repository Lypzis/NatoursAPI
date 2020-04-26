const fs = require('fs');
const mongoose = require('mongoose');

const Tour = require('../../models/tourModel');

const DB =
  'mongodb+srv://lypzis:G8JpYf0ZyqzZMty8@cluster0-q7pis.gcp.mongodb.net/natours?retryWrites=true&w=majority';

// Connecting to our database with mongoose
// NOTE: if using local database, just pass instead of DB: process.env.DATABASE_LOCAL
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

// READ JSON FILE
const tours = fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8');

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(JSON.parse(tours));
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }

  // to stop after running
  process.exit();
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }

  // to stop after running
  process.exit();
};

// SHOW OPTIONS
const showOptions = () => {
  console.log('use --import to import data or use --delete to delete all data');
  // to stop after running
  process.exit();
};

if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') deleteData();
else if (process.argv[2] === '--help') showOptions();

//deleteData().then(() => importData());
