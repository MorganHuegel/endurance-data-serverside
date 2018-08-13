'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('dotenv').config().parsed.JWT_SECRET;

const app = require('../server');
const { TEST_MONGODB_URI, JWT_EXPIRY } = require('../config');
const User = require('../db-models/users-model');
const Workout = require('../db-models/workouts-model');

const seedUsers = require('../seed-data/seed-users.json');
const seedWorkouts = require('../seed-data/seed-workouts.json');

const expect = chai.expect;
chai.use(chaiHttp);



describe('/USERS ENDPOINT', function(){
  let webToken;
  let user;

  before(function(){
    this.timeout(30000);
    return mongoose.connect(TEST_MONGODB_URI)
      .then(mongoose.connection.db.dropDatabase());
  });

  beforeEach(function(){
    this.timeout(30000);
    return Promise.all([
      User.insertMany(seedUsers),
      Workout.insertMany(seedWorkouts)
    ])
      .then( function([userRes, workoutRes]){
        user = userRes[0];
        webToken = jwt.sign(
          {username: user.username}, 
          JWT_SECRET, 
          {expiresIn: JWT_EXPIRY, subject:user.username});
      });
  });

  afterEach(function(){
    this.timeout(30000);
    return mongoose.connection.db.dropDatabase();
  });

  after(function(){
    this.timeout(30000);
    return mongoose.disconnect();
  });

  

  describe('POST to /users', function(){
    it('should create a user when provided username and password', function(){

      return chai.request(app).post('/users').send({username: 'billy', password: '12345678'})
        .then(function(response){
          expect(response).to.be.json;
          expect(response.body).to.be.a('string');
          expect(response).to.have.status(200);
          expect(response.ok).to.equal(true);
          expect(jwt.verify(response.body, JWT_SECRET)).to.have.keys('username', 'sub', 'iat', 'exp');
        });
    });

  });

  describe('PUT to /users', function(){
    it('should correctly update preferences and return the updated user', function(){
      expect(true).to.be.true;
    });

    it('should correctly update a password and rehash the password in the database', function(){
      expect(true).to.be.true;
    });

    it('should correctly update a username and respond with a new token', function(){
      expect(true).to.be.true;
    });

    it('should correctly update an email address', function(){
      expect(true).to.be.true;
    });
    
  });
});