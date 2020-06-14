const mongoose = require('mongoose');

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

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
