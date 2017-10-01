var Users = require('../models/users')
var bodyParser = require('body-parser')
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy
var fbconfig = require('../Oauth/fbconfig')
var Projects = require('../models/projects')
var moment = require('moment')

var urlencodedParser = bodyParser.urlencoded({ extended: false }) // this part is used being passed as a callback in the post statements
// var jsonParser = bodyParser.json() // Same but parses Json objects

// Initiating facebook strategy
passport.use(new FacebookStrategy({
  clientID: fbconfig.clientID,
  clientSecret: fbconfig.clientSecret,
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)']
},
  function (accessToken, refreshToken, profile, cb) {
    Users.findOrCreatefb(profile, function (err, user) {
      return cb(err, user)
    })
  }
))

// Functions that triggers the facebook log in on specific routes to force authentication
function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    console.log('authenticated')
    return next()
  }
  console.log('denied')
  res.redirect('/auth/facebook')
}

module.exports = function (app) {
  // Renders the landing page
  app.get('/', function (req, res) {
    Projects.find({ edition: 'Totem V', active: true }, ['name', 'leader', 'members_count', 'created_at'], { sort: { created_at: -1 } }, function (err, dbProjects, count) {
      if (err) return err
      if (req.isAuthenticated()) {
        console.log(req.session.passport.user.username)
        return res.render('index.ejs', { auth: req.isAuthenticated(), projects: dbProjects, count: dbProjects.length, username: req.session.passport.user.username, userid: req.session.passport.user._id })
      }
      if (!req.isAuthenticated()) {
        console.log('no user logged so far')
        return res.render('index.ejs', { auth: req.isAuthenticated(), projects: dbProjects, count: dbProjects.length })
      }
    })
  })

  // Renders the signin page
  app.get('/signin', function (req, res) {
    res.render('signin.ejs')
  })

  // Secret URL to handle admin creation. This is how rights will be given
  app.post('/newuser', urlencodedParser, function (req, res) {
    req.checkBody('email', 'Enter valid email').isEmail() // working for email
    req.checkBody('password', 'Password must be at least 6 characters').notEmpty().len(6, 30)    // working for passwords
    req.checkBody('username', 'Woops you forgot your username').notEmpty()
    var error = req.validationErrors()
    if (error) {
      console.log(error)
      res.send(error)
    } else {
      global.Users.register(req.body, function (err, user) {
        if (err) return res.send('error + Mongoose')
        res.send(user + ' saved')
      })
    }
  })
  // Renders the admin login page
  app.get('/login', function (req, res) {
    var sess = req.session
    if (sess.username) {
      return res.send('woops already loggedin')
    }
    return res.render('login.ejs')
  })
  // Here starts the facebook authentification routing
  app.get('/auth/facebook', passport.authenticate('facebook'))
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), function (req, res) {
    Users.checkmail(req.session.passport.user, function (err, valid) {
      if (err) return err
      valid ? res.redirect('/') : res.render('enteremail.ejs')
    })
  })
  // Renders the profile page of a member
  app.get('/profile/:userid', function (req, res) {
    Users.findOne({ _id: req.params.userid }, function (err, dbUser) {
      if (err) return err
      Users.activeprojects(dbUser, function (err, cb) {
        if (err) return err
        res.render('profilepage', { user: dbUser, moment: moment, count: cb.length, all_projects: cb })
      })
    })
  })
  // To test if user is authentified
  app.get('/testauth', ensureAuthenticated, function (req, res) {
    console.log(req.session.passport.user)
    Users.findById(req.session.passport.user, function (err, user) {
      if (err) {
        console.log(err)
        return err
      }
      res.send('authentified')
    })
  })
  // To log out
  app.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
  })

  // testing active projects
  app.get('/testarray', function (req, res) {
    Users.activeprojects(req.session.passport.user, function (cb) {
      console.log(cb)
    })
    res.send('check console')
  })
  // Here we handle the post method to add the email right after facebook authentication
  app.post('/addemail', function (req, res) {
    Users.findOneAndUpdate({ facebookId: req.session.passport.user.facebookId }, { valid_email: true, email: req.body.email },
      function (err, user) {
        if (err) { console.log(err); return (err) }
        console.log(user + '   updated')
        res.redirect('/')
      })
  })
  // Post method to control data coming from an admin signing up
  app.post('/loginform', urlencodedParser, function (req, res) {
    var sess = req.session
    req.checkBody('username', 'Woops you forgot your username').notEmpty()
    req.checkBody('password', 'Woops you forgot your password').notEmpty()
    var error = req.validationErrors()
    if (error) {
      console.log(error)
      res.send(error)
    } else {
      Users.findOne({ username: req.body.username }, function (err, user) {
        console.log(Users)
        if (err) return err
        if (!user) {
          return res.send('No user like this known')
        }
        Users.comparePassword(req.body.password, user, function (err, isMatch) {
          if (err) return err
          console.log(isMatch)
          if (isMatch) {
            sess.username = user.username
            return res.send('Logged in')
          } else {
            return res.send('sorry, wrong password: ' + req.body.password)
          }
        })
      })
    }
  })
} // end of the module export
