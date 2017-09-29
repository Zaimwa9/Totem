var express=require('express');
var app=express();
var config=require('./config');
var mongoose=require('mongoose');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
const session = require('express-session');
var passport = require('passport');

// Controllers
var usercontroller = require('./controllers/usercontroller.js');
var setupcontroller = require('./controllers/setupcontroller.js');
var projectcontroller = require('./controllers/projectcontroller.js');

// Miscellanous own modules
var mailgun = require('./controllers/mailfunctions.js')
var Users = require('./models/users');
var mgconfig = require('./config/index.js')

// Mongo for session storage
const MongoStore = require('connect-mongo')(session);

// Initializing port
var port = process.env.PORT || 3012;

passport.serializeUser(function(user, cb) {
  Users.findOne({facebookId: user.facebookId}, function(err, db_user){
    if (err) return err;
    user.email = db_user.email;
    cb(null, user);
  })
  
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Opening Mongo connection
var db = mongoose.connect(mgconfig.getDbConnectionstring(), function() {
    console.log('successfully connected')
});


app.use(session({
        key: 'session',
        secret: 'helloworld123',
        store: new MongoStore({
          mongooseConnection: db.connection
        })
}));

app.use(passport.initialize());

app.use(passport.session());

app.use('/assets', express.static(__dirname+'/public')); // this exposes the public folder to serve static files
                                                         // assets is a path, public is a folder
app.use(bodyParser({extended: true}));

app.use(expressValidator());

app.set('view engine', 'ejs');


// Calling all the controllers

usercontroller(app);
setupcontroller(app);
projectcontroller(app);

app.listen(port);

// Quick update function to change historic projects to active. Will be in the backoffice controller in the future
app.get('/projectstoactive', (req,res) => {
  Projects.update({active: null}, {active: true}, {multi: true}, function(err, result){
    if (err) return err;
    console.log('done ' + result);
    res.send('done updating' + result)
  })
});

// Adhoc command: fills up the members_array
app.get('/membersarray', (req,res) => {
  Projects.update({}, {members_array: "5927f4005cba963278d8ecc2"}, {multi: true}, function(err, result){
    if (err) return err;
    console.log('done ' + result);
    res.send('done updating' + result)
  })
});
app.get('/pendingarray', (req,res) => {
  Projects.update({}, {pending_members: []}, {multi: true}, function(err, result){
    if (err) return err;
    console.log('check ' + JSON.stringify(result));
    res.send('done updating' + JSON.stringify(result))
  })
})

