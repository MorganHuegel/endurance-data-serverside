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

const serializeDate = function(date){
  return moment(date).format('x');
}


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

  describe('GET to /workouts', function(){
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
            expect(workout).to.be.a('object');
            expect(workout.userId).to.equal(user.id);
          });
        });
    });
  });

  describe('POST to /workouts', function(){
    it('should add workout to Workouts collection and workouts array of User', function(){
      const newWorkout = {
        totalTime: {amount: 60, unit: 'minutes'},
        hoursOfSleep: 10,
        userId: user.id,
        date : '2015-07-30T00:00:00Z'
      };

      let workoutId;
      
      return chai.request(app).post('/workouts').send(newWorkout)
        .set('authorization', `Bearer ${webToken}`)
        .set('content-type', 'application/json')
        .then(function(apiResponse){
          workoutId = apiResponse.body.id;
          expect(apiResponse).to.be.json;
          expect(apiResponse).to.have.status(200);
          expect(apiResponse.body).to.contain.keys('userId', 'id', 'date');
          expect(apiResponse.body.userId).to.equal(user.id);
          Object.keys(newWorkout).forEach(field => {
            if(field === 'date'){
              expect(serializeDate(newWorkout.date)).to.equal(serializeDate(apiResponse.body.date));
            } else {
              expect(newWorkout[field]).to.deep.equal(apiResponse.body[field]);
            }
          });
          return Promise.all([
            User.findById(user.id),
            Workout.findById(workoutId)
          ]); //makes sure it gets added to database in both collections
        })
        .then(function([userResponse, workoutResponse]){
          expect(userResponse.workouts).to.include(workoutId); //reference is inserted into proper User data
          expect(workoutResponse).to.exist; //makes sure inserted into database
          Object.keys(newWorkout).forEach(field => {
            if(field === 'userId'){
              expect(workoutResponse.userId.toString()).to.equal(newWorkout.userId.toString());
            } else if (field === 'date'){
              expect(serializeDate(workoutResponse.date)).to.equal(serializeDate(workoutResponse.date));
            } else if (typeof newWorkout[field] !== 'object'){
              expect(workoutResponse[field].toString()).to.equal(newWorkout[field].toString());
            } else {
              expect(workoutResponse[field].amount).to.equal(newWorkout[field].amount);
              expect(workoutResponse[field].unit).to.equal(newWorkout[field].unit);
            }
          });
        });
    });
  });

  describe('DELETE to /workouts', function(){
    it('should delete a workout from Workout collection and pull it from User', function(){
      let preCount;
      let deletedWorkout;

      return Promise.all([
        User.findById(user.id),
        Workout.findOne({userId: user.id})
      ])
        .then( function([userRes, workoutRes]){
          preCount = userRes.workouts.length;   //so we can check the length after the deletion
          deletedWorkout = workoutRes;
          return chai.request(app).del(`/workouts/${deletedWorkout.id}`).set('authorization', `Bearer ${webToken}`);
        })
        .then(function(apiResponse){
          expect(apiResponse).to.have.status(204);
          expect(apiResponse.ok).to.equal(true);
          return Promise.all([
            User.findById(user.id),
            Workout.findById(deletedWorkout.id)
          ]);
        })
        .then(function([userResp, workoutResp]){
          expect(userResp.workouts.length).to.equal(preCount - 1); //makes sure it deletes from Users collection
          expect(userResp.workouts.includes(deletedWorkout.id)).to.equal(false);
          expect(workoutResp).to.be.null; //makes sure it deletes from Workouts collection
        });

    });
  });


  describe('PUT to /workouts', function(){
    it('should `replace` a workout when given a new workout body object', function(){
      const updateWorkout = {
        userId: user.id,
        hoursOfSleep: 5,
        waterDrank: {amount: 8, unit: 'cups'},
        averageHeartrate: 170,
        tss: 200,
        totalTime: {amount: 2, unit: 'hours'}
      };

      return Workout.findOne({userId: user.id})
        .then(function(workout){
          updateWorkout.id = workout.id;
          return chai.request(app).put('/workouts').send(updateWorkout)
            .set('authorization', `Bearer ${webToken}`)
            .set('content-type', 'application/json');
        })
        .then(function(apiRes){
          expect(apiRes).to.be.json;
          expect(apiRes.ok).to.be.true;
          Object.keys(updateWorkout).forEach(key => {
            expect(apiRes.body).to.contain.keys(key);
            expect(apiRes.body[key]).to.deep.equal(updateWorkout[key]);
          });
          return Workout.findById(apiRes.body.id);
        })
        .then(function(dbRes){
          expect(dbRes).to.exist;
          Object.keys(updateWorkout).forEach(key => {
            expect(dbRes[key]).to.exist;
            if(key === 'id' || key === 'userId'){
              expect(dbRes[key].toString()).to.equal(updateWorkout[key]);
            } else if(typeof dbRes[key] === 'object'){
              expect(dbRes[key].amount).to.equal(updateWorkout[key].amount);
              expect(dbRes[key].unit).to.equal(updateWorkout[key].unit);
            } else {
              expect(dbRes[key]).to.equal(updateWorkout[key]);
            }
          });
          //must parse database response as a json so that meta-data keys are not included
          expect(Object.keys(dbRes.toJSON()).length).to.equal(Object.keys(updateWorkout).length);
        });
    });
  });


});