const crypto = require('crypto');
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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide your password.'],
    minlength: [8, 'Your password must have 8 or more characters'],
    select: false // won't be returned to client, because this would be obviously a security flaw, even if encrypted
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
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
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

/**
 * Update changePasswordAt property for the user
 */
userSchema.pre('save', function (next) {
  // If password hasn't been modified or it is a new document, exit right away
  if (!this.isModified('password') || this.isNew) return next();

  // else
  // Actual date minus 1 second for a better timestamp accuracy,
  // making sure that the token is generated after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// This middleware will ensure that only active
// users are returned when a 'find' user(s) is used
// Remember, this regex is for strings that start with 'find'
userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } }); // $ne mongoose for not equal
  next();
});

// INSTANCE METHOD
/**
 * Compares the client password with the hashed stored.
 * candidatePassword - The password typed
 * userPassword - The hashed password
 */
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword); // true if equal, false if not
};

/**
 * Verifies if user changed password after the token was issued.
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp; // '100 < 200', No time traveleres, OK
  }

  // If with the condition above or here returns false, it means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // expires in 10 minutes

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
