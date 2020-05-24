const express = require('express');

const tourController = require('../controllers/tourController');

const router = express.Router();

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
  .get(tourController.getAllTours)
  .post(tourController.createTour); //(tourController.checkBody, tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
