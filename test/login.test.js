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

describe('/LOGIN ENDPOINT', function(){
  let user;
  let webToken;

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


  describe('POST to /login', function(){
    const newUser = {username: 'newUser', password: 'baseball'};

    it('should respond with a jwt token when user provides valid login credentials', function(){
      return chai.request(app).post('/users').send(newUser)
        .then(function(){
          return chai.request(app).post('/login').send(newUser);
        })
        .then(function(loginRes){
          expect(loginRes).to.be.json;
          expect(loginRes.ok).to.equal(true);
          expect(loginRes.body).to.be.a('string');

          //makes sure the token is valid
          const decodedToken = jwt.verify(loginRes.body, JWT_SECRET);
          expect(decodedToken.username).to.equal(newUser.username);

          //makes sure the token can be used to retrieve workouts (list of 0 for this user)
          return chai.request(app).get('/workouts')
            .set('authorization', `Bearer ${loginRes.body}`)
            .set('content-type', 'application/json');
        })
        .then(function(getResp){
          expect(getResp).to.be.json;
          expect(getResp.ok).to.equal(true);
          expect(getResp.body.workouts.length).to.equal(0);
          expect(getResp.body.username).to.equal(newUser.username);
        });
    });
  });

});