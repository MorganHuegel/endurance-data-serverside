'use strict';
const express = require('express');
const workoutRouter = express.Router();

const { verifyTokenMiddleware } = require('../auth/jwt');
const User = require('../db-models/users-model');
const Workout = require('../db-models/workouts-model');

workoutRouter.get('/', verifyTokenMiddleware, (req, res, next) => {
  const user = req.username;

  return User.findOne({username: user})
    .populate('workouts')
    .sort({'workouts.date': 'desc'})
    .then(userData => {
      if(!userData.id){
        const err = new Error('That user no longer exists.');
        err.status = 400;
        return next(err);
      }
      return res.json(userData).status(200);
    })
    .catch(err => next(err));
});


module.exports = workoutRouter;