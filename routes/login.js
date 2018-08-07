'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const loginRouter = express.Router();

const {jwtAuthorize, createJwtToken, jwtRefresh} = require('../auth/jwt');

const User = require('../db-models/users-model');
const Workout = require('../db-models/workouts-model');

loginRouter.post('/', (req, res, next) => {
  //make sure request contains username and password without whitespace
  ['username', 'password'].forEach(field => {
    if ( !req.body[field] ){
      const err = new Error(`${field} required to log in`);
      err.status = 400;
      return next(err);
    }
    if(req.body[field].trim() !== req.body[field]){
      const err = new Error(`${field} should not contain whitespace`);
      err.status = 400;
      return next(err);
    }
  });

  const username = req.body.username;
  const submittedPassword = req.body.password;

  User.findOne({username}).select({'password': true})
    .then(userInfo => {

      //if no database result, then username must be wrong
      if (!userInfo) {
        const err = new Error('Username does not exist');
        err.status = 400;
        return Promise.reject(err);
      }

      //bcrypt returns a boolean
      return bcrypt.compare(submittedPassword, userInfo.password);
    })
    .then( isValid => {
      if(!isValid){
        const err = new Error('Username and password do not match');
        err.status = 400;
        return Promise.reject(err);
      }

      return User.findOne({username}).populate('workouts').sort({date: 'DESC'});
    })
    .then(userData => {
      res.json(userData);
    })
    .catch(err => {
      return next(err);
    });
  

});

module.exports = loginRouter;