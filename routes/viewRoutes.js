const express = require('express');

const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
//const bookingController = require('../controllers/bookingController');

const router = express.Router();

// will run for every call to this route, there will(could) always be an special
// alert in case of necessity.
router.use(viewsController.alert);

//router.use(authController.isLoggedIn);

// after successfull payment, creates a booking checkout
// at the database, then redirects to the root overview
router.get(
  '/',
  // bookingController.createBookingCheckout, // TEMP, until deployed to a server
  authController.isLoggedIn,
  viewsController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
