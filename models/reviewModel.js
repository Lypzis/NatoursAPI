const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Your review can't be blank!"],
      minLenght: [10, 'Your review must have more than 10 characters!']
    },
    rating: {
      type: Number,
      required: [true, 'Your review must have a rating!'],
      min: [1, 'The minimum rating score is one!'],
      max: [5, 'The maximum rating score is five!']
    },
    createdAt: { type: Date, default: Date.now },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  // for enabling virtual properties
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicate reviews, a user can only have one review for that tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({ // no need to bring tour into its own review, would create a chain populate
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo' // in this case will only select name and photo
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // console.log(stats)
  if (stats.length > 0)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  else
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
};

reviewSchema.post('save', function () {
  // this points to current review

  // this.constructor = Review, but 'Review' wouldn't work
  // here because it is not declared yet
  this.constructor.calcAverageRatings(this.tour);
});

// For calculating the new average when updating or deleting a review
// findOneAndDelete
// findOneAndUpdate
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.findOne();

  //console.log(this.rev);

  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.rev = await this.findOne(); DOES NOT work here, because query has already executed.

  await this.rev.constructor.calcAverageRatings(this.rev.tour);
});
/////////////////////////////////////////////////////////////////

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
