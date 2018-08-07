'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
mongoose.Promise = global.Promise;

const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const workoutRouter = require('./routes/workouts');
const {CLIENT_ORIGIN, MONGODB_URI, PORT} = require('./config');



app.use(morgan('combined'));  //logs when requests come in
app.use(express.json());      //middleware that parses all requests as json
app.use(cors({origin: CLIENT_ORIGIN}));

app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/workouts', workoutRouter);


/*  If end of pipeline with no errors yet, 
   object must not exists in database */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});


/*  If error has status, send that error back
otherwise, send back general error citing server's fault */
app.use((err, req, res, next) => {
  if (err.status){
    console.log('ERR', err);
    //const errBody = Object.assign({}, err, {message: err.message});
    res.status(err.status).json({
      message: err.message,
      status: err.status
    });
  } else {
    res.status(500).json({message: 'Internal Server Error'});
  }
});




const serverListen = function(){
  app.listen(PORT, () => {
    console.info('Listening on port:' + PORT);
  })
    .on('error', err => {
      console.error('Express failed to start');
      console.error(err);
    });
};

const dbListen = function(){
  return mongoose.connect(MONGODB_URI)
    .catch(err => {
      console.error('Mongoose failed to connect :(');
      console.error('error:', err);
    });
};

if (require.main === module && process.env.NODE_ENV !== 'test'){
  serverListen();
  dbListen();
}