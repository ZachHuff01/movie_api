// Modules
const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose');
  
const Models = require('./model.js');

//Connect Mongoose to myDB
mongoose.connect(
  'mongodb://localhost:27017/myDB', 
  {useNewUrlParser: true, useUnifiedTopology: true }
  );

// Import Mongoose models
const app = express(),
    Movies = Models.Movie,
    Users = Models.User;


// Init body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Authentification & Login Endpoint
let auth = require('./auth')(app) // Login HTML Authentification
const passport = require('passport'); // JWT Authentification
require('./passport');


// Return list of all movies 
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.find()
  .then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});
// Get data about a single movie by title()
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
 await Movies.findOne({ Title: req.params.Title })
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);

    });
});

//Get data about genre by genre name 
app.get('movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'Genre.Name': req.params.genreName })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//Get data about director by directors name
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), async (req, res) =>{
  await Movies.find({ 'Director.Name': req.params.directorName })
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//Add new user
app.post('/users', async (req, res) => {
  await Users.findOne({ Username: req.body.Username })
  .then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + 'already exists');
    } else {
      Users
        .create({
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
        .then((user) =>{res.status(201).json(user) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});
// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }) , async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
//Get a user by username 
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOne({ Username: req.params.Username })
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
// Update a user's info, by username
app.put('/users/:userName', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.params.Username}, 
     {$set:
      {
        Username: req.body.Username,
        Password:req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
  },
  {new: true}) // This line makes sure that the updated document is returned

  .then((updatedUser) => {
    res.json(updatedUser);
  })
    .catch((err) => {
      console.error(err);
      res.status(500).send( 'Error: ' + err);
    })
});
// Add a movie to users favorite list
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) =>{
  await Users.findOneAndUpdate({ Username: req.params.Username },
  {
    $push: { FavoriteMovies: req.params.MovieID }
  },
  {new:true}) // This line makes sure that the updated document is returned

  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});
// Remove a movie from user favorite list
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) =>{
  await Users.findOneAndUpdate({ Username: req.params.Username },
    {
      $pull: { FavoriteMovies: req.params.MovieID }
    },
    {new:true}) // This line makes sure that the updated document is returned
  
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });
// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

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