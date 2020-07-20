const dotenv = require('dotenv');
const mongoose = require('mongoose');

// UNCAUGHT EXCEPTIONS
// obs: needs to be at the top, the first to start listening
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);

  process.exit(1);
});

// 'x' doesn't exists so it will throw an uncaught exception
//console.log(x);

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
//.catch(err => console.log('Error'));

// The port defined in config.env
// otherwise defaults to 3000
const port = process.env.PORT || 3000;

// starts the server listening;
const server = app.listen(port, () => {
  //console.log(`App running on port ${port}...`); // callback when starts listening
});
///////////////////////////////////////

// UNHANDLED SERVER REJECTIONS
process.on('unhandledRejection', err => {
  // if gets to this point, there isn't much else to do :(
  // only exit and pass '1' for 'rejection'
  // console.log('UNHANDLER REJECTION! Shutting down...');
  // console.log(err.name, err.message);

  // server.close finishes all the pending requests first
  // and then shuts down gracefully, ALWAYS DO LIKE THIS,
  // instead of directly calling process.exit
  server.close(() => {
    process.exit(1);
  });
});
