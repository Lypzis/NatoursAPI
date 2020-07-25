const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // IMPORTANT OBS: this is not secure for now, anyone who
    // access this route may create a booking, without paying...
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourID
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`, // will set an alert param
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 3) Create session response
  res.status(200).json({
    status: 'success',
    session
  });
});

// DEPRECATED IN FAVOR OF STRIPE WEBHOOK IMPLEMENTATION
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // Again, this is temporary, because it's unsecure: everyone can make bookings without paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   // basically: ${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}
//   // split in half...
//   // this will eventually redirect here again, but without 'tour', 'user' and 'price'
//   // it will end up returning 'next()';
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
  const tour = session.client_reference_id; // set at the above 'getCheckoutSession';
  const user = (await User.findOne({ email: session.customer_email })).id; // only the id is wanted
  // the only difference is here 'display_items' instead of 'line_items'
  const price = session.display_items[0].amount / 100; // back from the *100 conversion

  await Booking.create({ tour, user, price });
};

// This make the checkout process a lot more secure
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    // the body needs to be raw, remember, check app.js
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Stripe receives this response
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  // successful payment
  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking); // or { path:'reviews' }

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
