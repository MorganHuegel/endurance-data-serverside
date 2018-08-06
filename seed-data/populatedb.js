'use strict';

const mongoose = require('mongoose');
const {MONGODB_URI} = require('../config');

//const {MONGODB_URI} = process.env.MONGODB_URI || localhost:

const User = require('../db-models/users-model');
const Workout = require('../db-models/workouts-model');

const seedUsers = require('./seed-users.json');
const seedWorkouts = require('./seed-workouts.json');

console.log('Connecting to MongoDB');
return mongoose.connect(MONGODB_URI)
  .then( function(){
    console.info('DROPPING DATABASE');
    return mongoose.connection.db.dropDatabase();
  })
  .then( () => {
    return Promise.all([
      User.insertMany(seedUsers),
      Workout.insertMany(seedWorkouts)
    ]);
  })
  .then( ([res1, res2]) => {
    console.info(res1, res2);
    console.info('DISCONNECTING');
    mongoose.disconnect();
  });