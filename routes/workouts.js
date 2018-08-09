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
    .populate({path:'workouts', options:{sort: {date: -1}} })
    .then(userData => {
      //If they had an old token, userData would be null
      if(!userData){
        const err = new Error('Username no longer exists.  Please login again.');
        err.status = 400;
        return next(err);
      }
      return res.json(userData).status(200);
    })
    .catch(err => {
      return next(err);
    });
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




workoutRouter.post('/', verifyTokenMiddleware, (req, res, next) => {
  const username = req.username;
  let workoutId;

  const newWorkout = req.body; //userId and date should be appended to request body on the client-side
  console.log('NEW WORKOUT',newWorkout);
  Workout.create(newWorkout) //creates in workout collection
    .then(result => {
      workoutId = result.id;
      return User.findOneAndUpdate(   //grabs new id from response and adds it to workout array in Users
        {username},
        {$push: {workouts: workoutId}}
      );
    })
    .then( () => {
      return res.json({id: workoutId});  //sends the new id back, where client-side appends it to newWorkout Object before updating redux state
    })
    .catch(err => {
      console.log('ERR',err);
      next(err);
    });
});


module.exports = workoutRouter;