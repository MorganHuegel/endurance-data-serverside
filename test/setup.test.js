'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const {TEST_MONGODB_URI} = require('../config');

// Set NODE_ENV to `test` to disable http layer logs
// You can do this in the command line, but this is cross-platform
process.env.NODE_ENV = 'test';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const expect = chai.expect;
chai.use(chaiHttp);

before(function() {
  return mongoose.connect(TEST_MONGODB_URI)
    .catch(err => {
      console.error('Mongoose failed to connect');
      console.error(err);
    });
});

after(function() {
  return mongoose.disconnect();
});

describe('Mocha and Chai', function() {
  it('should be properly setup', function() {
    expect(true).to.be.true;
  });
});