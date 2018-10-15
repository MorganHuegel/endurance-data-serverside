# Endurance Data
  *The newest workout-log/fitness tracking tool!*
  
  Live App [here](https://endurancedata.netlify.com/)
  
  Client-side repo [here](https://github.com/MorganHuegel/endurance-data-clientside)
  

## API Documentation

### Authorization - Get a Json Webtoken

- Request Type: `POST`
- Path `https://endurance-data-server.herokuapp.com/login`
- Required Request Headers:  
```{Content-Type: 'application/json'}```
- Required JSON Body:
```
{
  username: 'UsernameStringGoesHere',
  password: 'PasswordStringGoesHere'
}
```
- Response Body will be a JSON Web Token:
```{authToken: 'theTokenWillBeAString'}```

  *Note: Webtoken is valid for 7 days after issue date*


### GET Workout Data
- Request Type: `GET`
- Path `https://endurance-data-server.herokuapp.com/workouts`
- Required Request Headers:  
```
{
  Content-Type: 'application/json',
  authorization: 'Bearer JsonTokenGoesHere'
}
```
*^^Notes that authorization is lowercase. This is because Endurance Data uses a 
custom middleware function to validate JSON Web Token*
- Response Body will be a JSON Object:
```
{
  username: 'String',
  email: 'String',
  preferences: 
    [
      'ArrayOfStringsSuchAs:', 'totalTime', 'totalDistance', 'maxHeartrate',...
    ],
  workouts: 
    [
      {
        userId: 'String',
        date: Date
        totalDistance: {amount: Number, unit: 'String'},
        totalTime: {amount: Number, unit: 'String'},
        averagePace: {amount: Number, unit: 'String'},
        maximumPace: {amount: Number, unit: 'String'},
        averageWatts: Number,
        maximumWatts: Number,
        totalElevation: {amount: Number, unit: 'String'},
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
        waterDrank: {amount: Number, unit: 'String'},
        notes: 'String'
      }, {...more workout objects...}
    ]
}
```
*^^Note, not all keys will be in each workout. Only userId and Date are necessarily required*
