'use strict';

const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  date: Date,    //Using seconds epoch time; this might need changed to Number input...
  totalDistance: {amount: Number, unit: String},
  totalTime: {amount: Number, unit: String},
  averagePace: {amount: Number, unit: String},
  maximumPace: {amount: Number, unit: String},
  averageWatts: Number,
  maximumWatts: Number,
  totalElevation: {amount: Number, unit: String},
  averageHeartrate: Number,
  maxHeartrate: Number,
  tss: Number,
  minutesStretching: Number,
  minutesFoamRollingMassage: Number,
  minutesCore: Number,
  injuryRating: Number,
  sorenessRating: Number,
  stressRating: Number,
  bodyWeight: Number,
  dietRating: Number,
  hoursOfSleep: Number,
  waterDrank: {amount: Number, unit: String},
  notes: String
});

workoutSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id,
    delete ret._id;
  }
});

module.exports = mongoose.model('Workout', workoutSchema);