var express=require('express');
var app=express();
var config=require('./config');
var Users = require('./models/users')
var mongoose=require('mongoose');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
const session = require('express-session');
var passport = require('passport');

// require controllers
var usercontroller=require('./controllers/usercontroller.js');
var setupcontroller=require('./controllers/setupcontroller.js');
var projectcontroller=require('./controllers/projectcontroller.js');
var mailgun=require('./controllers/mailfunctions.js')
var Users= require('./models/users');
var port=process.env.PORT || 3000;


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

app.get('/mailtest', function(req,res){
  mailgun.applyProject({leader: 'Wood Zm' ,email: 'B00549848@essec.edu', applicant: 'victor', project:'festin', body: 'Je pense être un bon membre pour ton projet'}) 
  res.send('mail sent')
});

//// Quick update function to change historic projects to active
app.get('/projectstoactive', (req,res) => {
  Projects.update({active: null}, {active: true}, {multi: true}, function(err, result){
    if (err) return err;
    console.log('done ' + result);
    res.send('done updating' + result)
  })
});
// to fill up the members_array
app.get('/membersarray', (req,res) => {
  Projects.update({}, {members_array: "5927f4005cba963278d8ecc2"}, {multi: true}, function(err, result){
    if (err) return err;
    console.log('done ' + result);
    res.send('done updating' + result)
  })
})

app.listen(port);

