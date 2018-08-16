'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  email: String,
  preferences: Array,
  workouts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Workout'}]
});

userSchema.plugin(uniqueValidator);

userSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id,
    delete ret._id;
    delete ret.password;
  }
});

module.exports = mongoose.model('User', userSchema);