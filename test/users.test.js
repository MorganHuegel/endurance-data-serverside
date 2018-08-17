'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || require('dotenv').config().parsed.JWT_SECRET;

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
      .then( () => mongoose.connection.db.dropDatabase());
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

    it('should respond with appropriate error if username is not supplied', function(){
      return chai.request(app).post('/users').send({username: '', password: '12345678'})
        .then(function(response){
          expect(response).to.be.json;
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Username is required');
          expect(response.ok).to.equal(false);
        });
    });

    it('should respond with appropriate error if username has whitespace', function(){
      return chai.request(app).post('/users').send({username: ' billy', password: '12345678'})
        .then(function(response){
          expect(response).to.be.json;
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Username must not contain whitespace');
          expect(response.ok).to.equal(false);
          return User.findOne({username: ' billy'});
        })
        .then(function(dbResult){
          expect(dbResult).to.be.null;
        });
    });

    it('should respond with appropriate error if password is not defined', function(){
      return chai.request(app).post('/users').send({username: 'billy', password: ''})
        .then(function(response){
          expect(response).to.be.json;
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Password is required');
          expect(response.ok).to.equal(false);
          return User.findOne({username: 'billy'});
        })
        .then(function(dbResult){
          expect(dbResult).to.be.null;
        });
    });

    it('should respond with appropriate error if password is too short', function(){
      return chai.request(app).post('/users').send({username: 'billy', password: '1234567'})
        .then(function(response){
          expect(response).to.be.json;
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Password must be at least 8 characters long');
          expect(response.ok).to.equal(false);
          return User.findOne({username: 'billy'});
        })
        .then(function(dbResult){
          expect(dbResult).to.be.null;
        });
    });

    it('should respond with appropriate error if password is too long', function(){
      const longPassword = '1234567890123456789012345678901234567890123456789012345678901234567890123';
      return chai.request(app).post('/users').send({username: 'billy', password: longPassword})
        .then(function(response){
          expect(response).to.be.json;
          expect(response).to.have.status(400);
          expect(response.body.message).to.equal('Password must be less than 72 characters long');
          expect(response.ok).to.equal(false);
          return User.findOne({username: 'billy'});
        })
        .then(function(dbResult){
          expect(dbResult).to.be.null;
        });
    });

    it('should store only the encrypted password when provided a string', () => {
      const password = '12345678';

      return chai.request(app).post('/users').send({username: 'billy', password})
        .then(() => {
          return User.findOne({username: 'billy'}).select({'password': true});
        })
        .then(dbRes => {
          expect(dbRes).to.be.not.null;
          expect(dbRes.password).to.not.equal(password);
          return bcrypt.compare(password, dbRes.password);
        })
        .then(bool => expect(bool).to.equal(true));
    });


    it('should assign a new user empty workout array and empty preferences', () => {
      return chai.request(app).post('/users').send({username: 'billy', password: '12345678'})
        .then(() => {
          return User.findOne({username: 'billy'});
        })
        .then(dbRes => {
          expect(dbRes.preferences).to.be.not.null;
          expect(dbRes.workouts).to.be.not.null;
          expect(dbRes.preferences).to.deep.equal([]);
          expect(dbRes.workouts).to.deep.equal([]);
        });
    });


    it('should return appropriate error if username is already taken', function(){
      let user;

      return User.findOne()
        .then(dbRes => {
          user = dbRes;
          return chai.request(app).post('/users').send({username: user.username, password: '12345678'});
        })
        .then(apiRes => {
          expect(apiRes).to.have.status(422);
          expect(apiRes).to.be.json;
          expect(apiRes.body.message).to.equal('Username already exists');
          expect(apiRes.ok).to.equal(false);
        });
    });

  });

  describe('PUT to /users', function(){
    it('should correctly update preferences and return the updated user', function(){
      const newPreferences = ['totalTime', 'averagePace', 'totalDistance', 'hoursOfSleep'];

      return chai.request(app).put('/users').send({preferences: newPreferences})
        .set('authorization', `Bearer ${webToken}`)
        .set('content-type', 'application/json')
        .then(function(apiRes){
          expect(apiRes).to.be.json;
          expect(apiRes).to.have.status(200);
          expect(apiRes.ok).to.equal(true);
          expect(apiRes.body.preferences).to.deep.equal(newPreferences);
          //makes sure it updated the correct user
          expect(apiRes.body.username).to.equal(user.username);
          expect(apiRes.body.id).to.equal(user.id);

          return User.findById(user.id);
        })
        .then(function(dbRes){
          expect(dbRes.preferences).to.deep.equal(newPreferences);

          //makes sure other user info remains untouched:
          expect(dbRes.username).to.equal(user.username);
          expect(dbRes.workouts).to.deep.equal(user.workouts);
          expect(dbRes.email).to.equal(user.email);
          expect(dbRes.password).to.equal(user.password);
        });
    });

    it('should correctly update a password and rehash the password in the database', function(){
      const newPassword = 'PrObAbLy!NoT A-ReAlPa$$w0rD';

      return chai.request(app).put('/users').send({password: newPassword})
        .set('authorization', `Bearer ${webToken}`)
        .set('content-type', 'application/json')
        .then(function(apiRes){
          expect(apiRes).to.be.json;
          expect(apiRes).to.have.status(200);
          expect(apiRes.ok).to.equal(true);

          //makes sure no other info was changed
          expect(apiRes.body.username).to.equal(user.username);
          expect(apiRes.body.password).to.not.exist;
          expect(apiRes.body.preferences).to.deep.equal(user.preferences);
          expect(apiRes.body.email).to.equal(user.email);
          expect(apiRes.body.workouts.length).to.equal(user.workouts.length);
          return User.findById(user.id);
        })
        .then(function(dbRes){
          expect(dbRes.password).to.not.equal(user.password);
          expect(dbRes.workouts).to.deep.equal(user.workouts);
          //make sure the user can still grab the appropriate data on login after password change
          return chai.request(app).post('/login').send({username: user.username, password: newPassword})
        })
        .then(function(loginRes){
          expect(loginRes.ok).to.be.true;
        });
    });

    it('should correctly update a username and respond with a new token', function(){
      const newUsername = 'Pr0BaBlY!NoT!A!uSeRn@mE';

      return chai.request(app).put('/users').send({username: newUsername})
        .set('authorization', `Bearer ${webToken}`)
        .set('content-type', 'application/json')
        .then(function(apiRes){
          expect(apiRes).to.be.json;
          expect(apiRes.ok).to.equal(true);
          expect(apiRes.body).to.be.a('string');
          const decodedToken = jwt.verify(apiRes.body, JWT_SECRET);
          expect(decodedToken.username).to.equal(newUsername);
          return User.findById(user.id);
        })
        .then(function(dbRes){
          expect(dbRes.username).to.equal(newUsername);

          //makes sure no other info was changed in database
          expect(dbRes.email).to.equal(user.email);
          expect(dbRes.password).to.equal(user.password);
          expect(dbRes.preferences).to.deep.equal(user.preferences);
        });
    });

    it('should correctly update an email address', function(){
      const newEmail = 'Pr0bAblY!N0T*A/rEaL/Email@foo.com';

      return chai.request(app).put('/users').send({email: newEmail})
        .set('authorization', `Bearer ${webToken}`)
        .set('content-type', 'application/json')
        .then(function(apiRes){
          expect(apiRes).to.be.json;
          expect(apiRes.ok).to.equal(true);
          expect(apiRes.body.email).to.equal(newEmail);

          //make sure no other info was changed:
          expect(apiRes.body.username).to.equal(user.username);
          expect(apiRes.body.preferences).to.deep.equal(user.preferences);
          expect(apiRes.body.workouts.length).to.deep.equal(user.workouts.length);
          return User.findById(user.id);
        })
        .then(function(dbRes){
          expect(dbRes.email).to.equal(newEmail);
          //make sure no other info was changed in database:
          expect(dbRes.username).to.equal(user.username);
          expect(dbRes.password).to.equal(user.password);          
          expect(dbRes.preferences).to.deep.equal(user.preferences);
          expect(dbRes.workouts).to.deep.equal(user.workouts);
        });
    });
    
  });
});