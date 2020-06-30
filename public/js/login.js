/* eslint-disable */

const login = async (email, password) => {
  console.log(email);
  console.log(password);

  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        // remember, the endpoint expects email and password
        email,
        password
      }
    });

    console.log(res);
  } catch (err) {
    console.log(err);
  }
};

document.querySelector('.form').addEventListener('submit', event => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  login(email, password);
});
