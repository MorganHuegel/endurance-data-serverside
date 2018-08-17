'use strict';
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const { JWT_EXPIRY } = require('../config');

const jwtAuthorize = function(token){
  return jwt.verify(token, JWT_SECRET, {
    algorithm: 'HS256'
  }, function(err, decoded){
    if(err) {
      return null;
    } else {
      return decoded;
    }
  });
};

const createJwtToken = function(user){
  //const username = JSON.stringify(user);
  return jwt.sign({username: user}, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRY,
    subject: user
  });
};


function verifyTokenMiddleware (req, res, next) {
  const bearerToken = req.headers.authorization;
  const indexOfSpace = bearerToken.indexOf(' ');
  const tokenValue = bearerToken.slice(indexOfSpace + 1, bearerToken.length);
  const currentUser = jwtAuthorize(tokenValue);

  if(!currentUser){
    const err = new Error('Please login to receive an updated token.');
    err.status = 401;
    return next(err);
  } else {
    req.username = currentUser.username;
    return next();
  }
}




const jwtRefresh = function(token){
  jwt.verify(token, JWT_SECRET, {}, function(err, decoded){
    if(err){
      return err;
    } else {
      return createJwtToken(token.subject);
    }
  });
};

module.exports = {
  jwtAuthorize, 
  createJwtToken, 
  jwtRefresh, 
  verifyTokenMiddleware 
};