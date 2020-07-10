/* eslint-disable */

import '@babel/polyfill'; // just include it here, and it will do the magic

import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { displayMap } from './mapbox';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

const email = document.getElementById('email');
const name = document.getElementById('name');
const photo = document.getElementById('photo');

const passwordCurrent = document.getElementById('password-current');
const password = document.getElementById('password');
const passwordConfirm = document.getElementById('password-confirm');

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

if (userDataForm)
  userDataForm.addEventListener('submit', event => {
    event.preventDefault();

    const form = new FormData();
    form.append('name', name.value);
    form.append('email', email.value);
    form.append('photo', photo.files[0]);

    console.log(form);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = document.querySelector('.btn--save-password');
    submitButton.innerHTML = 'Updating...';

    await updateSettings(
      {
        password: passwordCurrent.value,
        newPassword: password.value,
        newPasswordConfirm: passwordConfirm.value
      },
      'password'
    );

    submitButton.innerHTML = 'save password';
    passwordCurrent.value = '';
    password.value = '';
    passwordConfirm.value = '';
  });
///////////////
