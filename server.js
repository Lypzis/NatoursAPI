const app = require('./app');

const port = 3000;

// starts the server listening;
app.listen(port, () => {
  console.log(`App running on port ${port}...`); // callback when starts listening
});
///////////////////////////////////////
