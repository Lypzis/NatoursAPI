/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51H4Rl3Bcp4rXuvfvWroOnhzKeENB9P5JdJuODAgrKCQoSFviUBLOOYeYnnS7fT2eZo07jeUQVLU4IEODIf8gJNqs00uWs8byPm'
);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from endpoint (API)
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);

    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
