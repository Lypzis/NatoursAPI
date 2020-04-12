const express = require('express');

const tourController = require('../controllers/tourController');

const router = express.Router();

// only works here, on this router, where it is specified
// receives de 'id' as value, then checks it
// before proceding.
router.param('id', tourController.checkID);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id/:duration?')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
