'use strict';
const express = require('express');
const workoutRouter = express.Router();

const { verifyTokenMiddleware } = require('../auth/jwt');
const User = require('../db-models/users-model');
const Workout = require('../db-models/workouts-model');

workoutRouter.get('/', verifyTokenMiddleware, (req, res, next) => {
  const user = req.username;

  return User.find({username: user})
    .populate('workouts')
    .sort({'workouts.date': 'desc'})
    .then(userData => {
      /* TO-DO: put a check here that validates that the user still exists.
      (could have a valid token to a deleted user) */
      return res.json(userData);
    })
    .catch(err => next(err));
});

module.exports = workoutRouter;