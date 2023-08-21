const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require('body-parser');
const uuid = require('uuid');
const app = express();

//#1 Return list of all movies 
app.get('/movies', (req, res) => {
  res.send('Successful GET returning data on all the movies')
});

//#2 Get data about a single movie by name
app.get('/movies/:movieName', (req, res) => {
  res.send('Succesful GET returning data on a single movie by name')
});

//#3 Get data about a genre by genre's name
app.get('/movies/genre/:genreName', (req, res) => {
  res.send('Successful GET returning data on genres by genre name');
});
//#4 Get data abou director by directors name
app.get('/movies/directors/:directorName', (req, res) =>{
  res.send('Successful GET returning data on directors by directors name')
});
//#5Add new user
app.post('/users', (req, res) => {
  res.send('Successful POST adding new user')
});
//#6 Update user information
app.put('/users/:userName', (req, res) => {
  res.send('Succesful PUT updated user info')
});
//#7 Add a movie to users favorite list
app.post('/users/:userName/movies/:movieID', (req, res) =>{
  res.send('Successful POST adding movies to user favortite list')
});
//#8 Remove a movie from user favorite list
app.delete('/users/:userName/movies/:movieID', (req, res) =>{
  res.send('Succesful DELETE movies deleted fron users favorite list')
});
//#9 Delete user registration
app.delete('/users/:userName', (req, res) =>{
  res.send('Successful DELETE user account deleted')
})


//error handling middleware function
//should be last, but before app.listen()
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("something broke");
  });

//listen for requests
  app.listen(8080, () => {
    console.log("Your app is listening on port 8080.");
  });