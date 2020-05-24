const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
    required: [true, 'Please, tell us your name!'],
    maxlength: [120, 'Your name must have less than 120 character.']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true, // the identifier of the user, which should be unique
    lowercase: true, // turns the string to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'] // custom validator
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide your password.'],
    minlength: [8, 'Your password must have 8 or more characters']
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on SAVE and CREATE!!! so DO NOT use UPDATE when changing password
      validator: function (el) {
        return el === this.password; // abc === abc, true; abc === xyz, false
      },
      message: 'Passwords are not the same!'
    }
  }
});

// PASSWORD ENCRYPTION MIDDLEWARE
// password encryption, between getting and saving the data
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // else
  // HASH the password with cost 12
  // 12 is a balance between speed and security, the higher the number, the more secure but slower
  this.password = await bcrypt.hash(this.password, 12);

  // this is only needed to check if user wrote correctly his password
  // meaning that it doesn't need to be stored in the database,
  // being deleted as 'undefined'
  this.passwordConfirm = undefined;

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
