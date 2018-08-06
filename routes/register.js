'use strict';

const bcrypt = require('bcryptjs');
const express = require('express');
const mongoose = require('mongoose');
const registerRouter = express.Router();

const User = require('../db-models/users-model');

registerRouter.post('/', (req, res, next) => {
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
  bcrypt.hash(password, 8)
    .then(hashedPassword => {
      return User.create({
        username,
        password: hashedPassword, 
        workouts: [],
        preferences: []
      });
    })
    .then(dbResponse => {
      return res.json(dbResponse);
    })
    .catch(err => {
      if(err.code === 11000){   //error code 11000 comes from database error
        const newErr = new Error('Username already exists');
        newErr.status = 422;
        return next(newErr);
      }
      return next(err);
    });
});


module.exports = registerRouter;