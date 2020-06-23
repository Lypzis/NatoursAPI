const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// reviews coming from tours will end up being redirected here
// POST /tour/384hfhufhjd/reviews
// POST /reviews

// will merge with tour route to get access to its params here
const router = express.Router({ mergeParams: true });

// No one can access the below routes without being logged in(authenticated)
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  // you obviously needs to be a user in order to submit a review
  .post(
    authController.protect,
    authController.restrictedTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictedTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictedTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
