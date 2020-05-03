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

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour); //(tourController.checkBody, tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
