'use strict';

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost/workout-log',
  TEST_MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost/test-workout-log',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  PORT: process.env.PORT || '8080',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d'
};