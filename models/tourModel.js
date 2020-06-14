const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// const User = require('./userModel'); // in case of embedding

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
      minlength: [10, 'A tour name must have more or be equal to 10 characters'] // another validator
      // will check if contains only letters, check 'validator' docs
      // also trhows errors if it find spaces between words,
      // so not very useful here
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain letters a-z,A-Z.'
      // ]
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
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this validator won't work on update though, only in creation
          // 'this' only points to current doc on NEW document creation
          // val = priceDiscount
          return val < this.price; // the price discount should always be lower than the price
        },
        // mongoose sintax '{VALUE}' will change it for the actual 'priceDiscount' value
        message: 'Discount price ({VALUE}) should be below regular price.'
      }
    },
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
    },
    // 'startLocation' and 'locations' are embedded(documents[or objects :D] inside documents) documents
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        dafault: 'Point', // always the default though
        enum: ['Point']
      },
      coordinates: [Number], // an array of numbers is expected
      address: String,
      description: String
    },
    locations: [
      // an array of object locations
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        description: String,
        day: Number
      }
    ],
    // guides: Array // in case of embedding
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }] // referencing
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

// Virtual Populate
// for parent referencing its tour reviews,
// without persisting the data into an ilimited array as if it was a child referencing
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // this is the field to populate in 'Review'
  localField: '_id' // this is the 'id' from this tour
});

// DOCUMENT MIDDLEWARE, which will run before an event
// in this case the 'save' (only runs on .save() and .create()), not for update
tourSchema.pre('save', function (next) {
  // this.slug needs to be defined in the schema first in order to be saved
  this.slug = slugify(this.name, { lower: true }); // will replace the tour name characters to lower case characters

  next(); // REMEMBER to always add this or it will end up stuck forever D:
});

// Middleware for embedding guides on 'save'
// Finds user with corresponding 'id', then
// adds him to the 'this.guides' array
// tourSchema.pre('save', async function (next) {
//   // will end up returning an array of promises
//   const guidesPromises = this.guides.map(async id => await User.findById(id));

//   // resolve all promises of the array and set the result to guides
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

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

// populate will bring the guides documents along with the tour which references them
// the select options with the '-' in front of the attributes will remove them from the result
tourSchema.pre(/^find/, function (next) {
  // REMEMBER: 'this' points to the current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

// 'post' happens after the find executes and 'pre' before, just to make things clear :D
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} milliseconds!`);
  //console.log(docs);
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
