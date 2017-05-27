var express=require('express');
var app=express();
var config=require('./config');
var Users=require('./models/users.js');
var mongoose=require('mongoose');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
const session = require('express-session');
var passport = require('passport');

// require controllers
var usercontroller=require('./controllers/usercontroller.js');
var setupcontroller=require('./controllers/setupcontroller.js');
var projectcontroller=require('./controllers/projectcontroller.js');

var port=process.env.PORT || 3000;


passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

mongoose.connect(config.getDbConnectionstring(),function(){
        console.log('Successfuly connected')
        });

app.use(session({
        key: 'session',
        secret: 'helloworld123',
        store: require('mongoose-session')(mongoose)
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/assets', express.static(__dirname+'/public')); //this exposes the public folder to serve static files

app.use(bodyParser({extended: true}));

app.use(expressValidator());

app.set('view engine', 'ejs');


// Calling all the controllers

usercontroller(app);
setupcontroller(app);
projectcontroller(app);

app.listen(port);

