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
  let dbNewWorkout;

  const newWorkout = req.body; //userId and date should be appended to request body on the client-side
  Workout.create(newWorkout) //creates in workout collection
    .then(result => {
      dbNewWorkout = result;
      return User.findOneAndUpdate(   //grabs new id from response and adds it to workout array in Users
        {username},
        {$push: {workouts: dbNewWorkout.id}}
      );
    })
    .then( () => {
      return res.json(dbNewWorkout);  //sends the new workout back, where cliet-side can append to redux state
    })
    .catch(err => {
      next(err);
    });
});



workoutRouter.put('/', verifyTokenMiddleware, (req, res, next) => {
  const username = req.username;
  const workoutUpdate = req.body;

  return User.findOne({_id: workoutUpdate.userId, username}) //verifies that the workout belongs to the user with the token
    .then(result => {
      if(!result){
        const err = new Error('Not authorized to edit this workout');
        err.status = 401;
        return next(err);
      } else {
        return Workout.replaceOne({_id: workoutUpdate.id}, workoutUpdate);
      }
    })
    .then( () => {
      return Workout.findOne({_id: workoutUpdate.id});
    })
    .then( updatedWorkout => {
      return res.json(updatedWorkout);
    })
    .catch(err => next(err));
});


module.exports = workoutRouter;