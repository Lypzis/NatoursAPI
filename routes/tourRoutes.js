const express = require('express');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// This means that when a URL like this '/tour/384hfhufhjd/reviews' comes,
// redirects it to 'reviewRouter' instead
router.use('/:tourId/reviews', reviewRouter);

// will use a middleware to bring on the results
// that are in accordance with the alias route: 'top-5-cheap' :D
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// GEOSPATIAL ROUTE
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi  // another way to put this route
// /tours-within/233/center/-40,45/unit/mi // instead, I'm using this.

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  // catchAsync can be applied here as '.get(catchAsync(tourController.getAllTours))'
  // and to all the other ones but it wouldn't be a good practice,
  // since here, it is difficult to track which function is actually async
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.createTour
  ); //(tourController.checkBody, tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    // this is restricted to loged in admins, simple as that :D
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
