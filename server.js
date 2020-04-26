const dotenv = require('dotenv');
const mongoose = require('mongoose');

// run this before anything else,
// or you will get undefined variables
dotenv.config({ path: './config.env' });

const app = require('./app');

// replacing the placeholder password for the actual password,
// to connect to our remote database
const DB = process.env.DATABASE_REMOTE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

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

// The port defined in config.env
// otherwise defaults to 3000
const port = process.env.PORT || 3000;

// starts the server listening;
app.listen(port, () => {
  //console.log(`App running on port ${port}...`); // callback when starts listening
});
///////////////////////////////////////
