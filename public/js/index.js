/* eslint-disable */

import '@babel/polyfill'; // just include it here, and it will do the magic

import { login, logout } from './login';
import { displayMap } from './mapbox';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');

const email = document.getElementById('email');
const password = document.getElementById('password');

const logOutButton = document.querySelector('.nav__el--logout');
/////////////////

// DELEGATION

// the locations are being read from the data in the html loaded
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);

  displayMap(locations); // REMEMBER: for bug reasons mapbox module can't yet be used along with parcel
}

if (loginForm)
  loginForm.addEventListener('submit', event => {
    event.preventDefault();

    login(email.value, password.value);
  });

if (logOutButton) logOutButton.addEventListener('click', logout);
///////////////
