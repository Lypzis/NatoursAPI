const express = require('express');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// REFACTORED to the below
// POST /tour/384hfhufhjd/reviews review is a child of tour coming from an loged in user
// GET /tour/384hfhufhjd/reviews
// GET /tour/384hfhufhjd/reviews/374843hfd
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictedTo('user'),
//     reviewController.createReview
//   );

// This means that when a URL like this '/tour/384hfhufhjd/reviews' comes,
// redirects it to 'reviewRouter' instead
router.use('/:tourId/reviews', reviewRouter);

// only works here, on this router, where it is specified
// receives de 'id' as value, then checks it
// before proceding.
//router.param('id', tourController.checkID);

// will use a middleware to bring on the results
// that are in accordance with the alias route: 'top-5-cheap' :D
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  // catchAsync can be applied here as '.get(catchAsync(tourController.getAllTours))'
  // and to all the other ones but it wouldn't be a good practice,
  // since here, it is difficult to track which function is actually async
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour); //(tourController.checkBody, tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    // this is restricted to loged in admins, simple as that :D
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
