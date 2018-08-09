'use strict';
const express = require('express');
const mongoose = require('mongoose');
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


workoutRouter.delete('/:id', verifyTokenMiddleware, (req, res, next) => {
  const user = req.username; //from token (middleware)
  const workoutId = req.params.id;
  let userId;

  if(!mongoose.Types.ObjectId.isValid(workoutId)){
    const err = new Error('ID in parameters is not valid');
    err.status = 422;
    return next(err);
  }

  // gets the userId from the username in the token
  return User.findOne({username: user})
    .then(userObj => {
      userId = userObj.id;
      
      // deletes workout only if ID in parameters 
      // belongs to the user in the webtoken
      return Workout.findOneAndDelete({userId, _id: workoutId});
    })
    .then( successfulDelete => {
      if(!successfulDelete){
        const err = new Error('Workout ID not found.');
        err.status = 404;
        return Promise.reject(err);
      }
      return User.findOneAndUpdate(
        {_id: userId},
        {$pull: {workouts: workoutId}}, //pulls workout ID out of User collection
        {new: true}
      );
    })
    .then(result => {
      return res.sendStatus(204);
    })
    .catch(err => next(err));
});


module.exports = workoutRouter;