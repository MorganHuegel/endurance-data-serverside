'use strict';
const moment = require('moment');
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
    return mongoose.connection.db.dropDatabase();
  });

  after(function(){
    return mongoose.disconnect();
  });

  describe.only('GET to /workouts', function(){
    it('should return user data with workouts populated', function(){
      return chai.request(app).get('/workouts')
        .set('authorization', `Bearer ${webToken}`)
        .set('content-type', 'application/json')
        .then(response => {
          expect(response).to.be.json;
          expect(response).to.have.status(200);
          expect(response.ok).to.be.true;
          expect(response.body).to.contain.keys('preferences', 'username', 'workouts', 'id');
          expect(response.body.username).to.equal(user.username);
          return response.body.workouts;
        })
        //makes sure workout list is sorted by date (descending)
        .then(function(workoutList){
          const sortedList = [...workoutList];
          sortedList.sort(function(a, b) {
            return moment(b.date).format('x') - moment(a.date).format('x');
          });
          expect(workoutList).to.deep.equal(sortedList);
          //makes sure each workout belongs to the user in the token
          workoutList.forEach(function(workout) {
            expect(workout.userId).to.equal(user.id);
          });
        });
    });
  });


});