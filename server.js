const dotenv = require('dotenv');

// run this before anything else,
// or you will get undefined variables
dotenv.config({ path: './config.env' });

const app = require('./app');

const { env } = process;

// The port defined in config.env
// otherwise defaults to 3000
const port = env.PORT || 3000;

// starts the server listening;
app.listen(port, () => {
  //console.log(`App running on port ${port}...`); // callback when starts listening
});
///////////////////////////////////////
