'use strict';
const jwt = require('jsonwebtoken');
require('dotenv').config();

const {JWT_SECRET, JWT_EXPIRY} = require('../config');

//returns true or undefined
const jwtAuthorize = function(token){
  return jwt.verify(token, JWT_SECRET, {
    algorithm: 'HS256'
  }, function(err, decoded){
    if(err) {
      return err;
    } else {
      return decoded;
    }
  });
};


const createJwtToken = function(user){
  return jwt.sign({user}, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRY,
    subject: user.username
  });
};

const jwtRefresh = function(token){
  jwt.verify(token, JWT_SECRET, {}, function(err, decoded){
    if(err){
      return err;
    } else {
      return createJwtToken(token.subject);
    }
  });
};

module.exports = {jwtAuthorize, createJwtToken, jwtRefresh};