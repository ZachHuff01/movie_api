// Modules
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Models = require('./model.js');
const {check, validationResult} = require('express-validator');
    //Connect Mongoose to myDB
// mongoose.connect(
//   'mongodb://localhost:27017/myDB', 
//   {useNewUrlParser: true, useUnifiedTopology: true }
//   );
  mongoose.connect('mongodb+srv://zhuff1:VDimYzoPO8iGKF1x@mydb.tzivuue.mongodb.net/myDB?retryWrites=true&w=majority', {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
  });


// Import Mongoose models
const app = express(),
    Movies = Models.Movie,
    Users = Models.User;


// Init body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Cross-Origin Resource Sharing (CORS)
const cors = require('cors');
app.use(cors());
//Allows Certain domains to use API
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application does not allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

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
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async (req, res) => {
  Movies.find({ 'Genre.Name': req.params.genreName })
    .then((movies) => {
      if (!movies) {
        return res.status(404).send('Error:' + 'Genre not found')}
        else {
          res.status(200).json(movies);
        }
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
app.post('/users',
// Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    } 
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
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
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
[
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {

// check the validation object for errors
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
 
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
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
    if (!updatedUser) {
      return res.status(404).send('Error:' + 'User was not found');
    }
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
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});













