'use strict';

const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const usersRouter = express.Router();

const User = require('../db-models/users-model');
const { createJwtToken, verifyTokenMiddleware } = require('../auth/jwt');




usersRouter.post('/', (req, res, next) => {
  const {username, password} = req.body;

  //validate incoming username exists
  if(!username){
    const err = new Error('Username is required');
    err.status = 400;
    return next(err);
  }

  //validate that incoming username does not have whitespace
  if(username.trim() !== username) {
    const err = new Error('Username must not contain whitespace');
    err.status = 400;
    return next(err);
  }

  //validate that incoming password exists
  if(!password){
    const err = new Error('Password is required');
    err.status = 400;
    return next(err);
  }

  //validate length of password (minimum)
  if(password.length < 8 ){
    const err = new Error('Password must be at least 8 characters long');
    err.status = 400;
    return next(err);
  }

  //validate length of password (maximum)
  if(password.length > 72){
    const err = new Error('Password must be less than 72 characters long');
    err.status = 400;
    return next(err);
  }

  //encrypts password, then stores in User collection of database
  return bcrypt.hash(password, 8)
    .then(hashedPassword => {

      return User.create({
        username,
        password: hashedPassword,
        workouts: [],
        preferences: []
      });
    })
    //creates web token, sends it back to client-side
    .then( (res) => {
      return createJwtToken(username);
    })
    .then(token => {
      return res.json(token);
    })
    .catch(err => {
      if(err.name === 'ValidationError'){
        const newErr = new Error('Username already exists');
        newErr.status = 422;
        return next(newErr);
      }
      return next(err);
    });
});




usersRouter.put('/', verifyTokenMiddleware, (req, res, next) => {
  const username = req.username;
  const updateBody = req.body;

  const possibleUpdates = [
    'username', 
    'password', 
    'email', 
    'preferences', 
    'workouts'
  ];

  //checks that each field in updateBody is actually a field in the database
  if ( !Object.keys(updateBody)
    .every(field => possibleUpdates.includes(field))
  ) {
    const err = new Error('Update body contains fields that are not in the database');
    err.status = 400;
    return next(err);
  }

  if(updateBody.username){
    if(updateBody.username.length < 1){
      const err = new Error('Usernames must be at least 1 character.');
      err.status = 400;
      return next(err);
    } else if (updateBody.username.trim() !== updateBody.username) {
      const err = new Error('Usernames should not contain whitespace.');
      err.status = 400;
      return next(err);
    }
  }

  //if changing password, need to encrypt it again
  if(updateBody.password){
    if(updateBody.password.trim() !== updateBody.password) {
      const err = new Error('Password cannot contain whitespace');
      err.status = 400;
      return next(err);
    } else if (updateBody.password.length < 8){
      const err = new Error('Password must be at least 8 characters long.');
      err.status = 400;
      return next(err);
    } else if (updateBody.password.length > 72){
      const err = new Error('Password must be less than 72 characters long.');
      err.status = 400;
      return next(err);
    }

    return bcrypt.hash(updateBody.password, 8)
      .then(hashedPassword => {
        return User.findOneAndUpdate(
          {username},
          {password: hashedPassword},
          {new: true}
        );
      })
      .then(updatedUser => res.json(updatedUser))
      .catch(err => next(err));
  }

  //if changing username, email, or preferences
  return User.findOneAndUpdate(
    {username},
    updateBody,
    {new: true}
  )
    .then(result => {
      if (!result) {
        return next();
      } else if (!updateBody.username) {
        return res.json(result);
      } else {
        const token = createJwtToken(result.username);
        res.json(token);
      }
    })
    .catch(err => {
      if(err.name === 'ValidationError'){ //this Validation Error only occurs during testing with Mocha, not in the Live App
        const newErr = new Error('Username already exists');
        newErr.status = 422;
        return next(newErr);
      } else if (err.code === 11000) { //this Error Code is what will appear in the live app
        const error = new Error('Username already exists.');
        error.status = 422;
        return next(error);
      } else {
        return next(err);
      }
    });
});


module.exports = usersRouter;