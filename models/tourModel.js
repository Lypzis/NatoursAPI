const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'],
      trim: true,
      unique: true,
      maxlength: [
        40,
        'A tour name must have less or be equal to 40 characters'
      ], // a validator
      minlength: [10, 'A tour name must have less or be equal to 40 characters'] // another validator
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      // and ... another validator, check mongoose docs for more schema validators
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above or equal 1.0'], // more types of validators
      max: [5, 'Rating must be below or equal 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: { type: Number, required: [true, 'A tour must have a price.'] },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // with this, it will no longer be sent to user
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  // this second argument will enable virtual properties
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual properties
// properties that won't be stored in the database but will actually be a
// conversion of one stored when in need to display to the user some custom data of it
// 'durationWeeks' the name of the property
tourSchema.virtual('durationWeeks').get(function () {
  // normal function, because I don't want to access the global scope in this case,
  // since, 'duration' will not be found
  // so 'this' will refer to just what is inside of this 'function', which has
  // every attribute from 'tourSchema' available
  return this.duration / 7; // calculation for the week, each week has 7 days and durantion refer to the schema 'duration' attribute
}); // created on each get

// DOCUMENT MIDDLEWARE, which will run before an event
// in this case the 'save' (only runs on .save() and .create())
tourSchema.pre('save', function (next) {
  // this.slug needs to be defined in the schema first in order to be saved
  this.slug = slugify(this.name, { lower: true }); // will replace the tour name characters to lower case characters

  next(); // REMEMBER to always add this or it will end up stuck forever D:
});

// it can have multiple 'pre's
// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');

//   next();
// });

// // another middleware
// tourSchema.post('save', function (doc, next) {
//   // in this case, 'doc' will represent 'this'
//   console.log(doc);

//   next();
// });

// QUERY MIDDLEWARE
// will execute when .find is used in the controller,
// tourSchema.pre('find', function (next) { // not working for .findOne
// now it will, for every string that starts with "find"
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // get all tours that are'nt secret

  this.start = Date.now();

  next();
});

// 'post' happens after the find executes and 'pre' before, just to make things clear :D
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} milliseconds!`);
  console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // will add another match condition to beginning of the array pipeline
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
