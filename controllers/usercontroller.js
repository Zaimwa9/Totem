//here we will process all the requests concerning the users
//Meaning each time a request involve an action on the user it will be sent here and processed

var Users= require('../models/users');
var bodyParser = require('body-parser');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var fbconfig = require('../Oauth/fbconfig');
var Projects = require('../models/projects');
var moment = require('moment');

var urlencodedParser=bodyParser.urlencoded({extended:false}); // this part is used being passed as a callback in the post statements
var jsonParser=bodyParser.json(); // Same but parses Json objects

passport.use(new FacebookStrategy({
    clientID: fbconfig.clientID,
    clientSecret: fbconfig.clientSecret,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)']
  },
  function(accessToken, refreshToken, profile, cb) {
    Users.findOrCreatefb(profile, function (err, user) {
      return cb(err, user);
    });
  }    
));


function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { console.log('authenticated'); return next(); }
        console.log('denied');
        res.redirect('/auth/facebook');
}

module.exports=function(app){
    
    //Serves the landing page
    app.get('/', (req,res) => {
        Projects.find({edition : 'Totem V'}, ['name', 'leader', 'members_count', 'created_at'], { sort: {created_at: -1}}, function (err, results, count){
        if (err) return err;
        if (req.isAuthenticated())
            {
                console.log(req.session.passport.user.username);
                return res.render('index.ejs', {auth: req.isAuthenticated(), projects: results, count: results.length, username: req.session.passport.user.username});
            }
        if (!req.isAuthenticated())
            {
                console.log('no user logged so far');
                return res.render('index.ejs', {auth: req.isAuthenticated(), projects: results, count: results.length});
            }
        });
    });

    //Serves the signin page (could be included as client-side Javascript no ?)
    app.get('/signin', (req,res) => {
        res.render('signin.ejs')
    });

    //This part handles the signin and user creation
    app.post('/newuser', urlencodedParser, (req,res)=>{
        
        req.checkBody('email',"Enter valid email").isEmail();      // working for email
        req.checkBody('password',"Password must be at least 6 characters").notEmpty().len(6,30);    // working for passwords
        req.checkBody('username','Woops you forgot your username').notEmpty();

        var error=req.validationErrors();            
           
        if (error) {
            console.log(error);
            res.send(error); return
        }
        else
        {   
            global.Users.register(req.body, function(err, user){
                if (err) return res.send('error + Mongoose');
                res.send(user +' saved');
            });
        };
    }); //end of the signup post

    // Serves the loginpage
    app.get('/login', (req,res) => {
        sess=req.session;
        if (sess.username){    
            return res.send('woops already loggedin')
        }
        return res.render('login.ejs')
    });

    app.post('/loginform', urlencodedParser, (req,res) => {
        sess=req.session;
        req.checkBody('username','Woops you forgot your username').notEmpty();
        req.checkBody('password','Woops you forgot your password').notEmpty();

        var error=req.validationErrors();

        if (error){
            console.log(error);
            res.send(error); return
        }
        else
        {   
            Users.findOne({username: req.body.username}, function(err, user){
                console.log(Users);
                if (err) return err;

                if (!user) {return res.send('No user like this known')};
                
                Users.comparePassword(req.body.password, user, function(err, isMatch){
                    if (err) return err;

                    console.log(isMatch);
                    
                    if (isMatch) 
                    {
                        sess.username = user.username ;
                    
                        return res.send('Logged in');
                    }
                    else
                    {
                        return res.send('sorry, wrong password: '+ req.body.password);
                    }
                });
            }); //end of findOne
        };
    }); // end of the post


    app.get('/profile/:username', (req,res) => {
        Users.findOne({username: req.params.username}, function (err, db_user){
            res.render('profilepage', {user: db_user, moment: moment, count: db_user.projects_array.length});
        })
    });

    //Here starts the facebook authentification routing
    
    app.get('/auth/facebook', 
        passport.authenticate('facebook'));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {failureRedirect: '/'}), function(req,res){
            Users.checkmail(req.session.passport.user, function(err,valid){
                if (err) return err;
                (valid) ? res.redirect('/') : res.render('enteremail.ejs'); 
                })
        });

    //Here we handle the post method to add the email right after facebook authentication
    app.post('/addemail', (req,res) => {
        Users.findOneAndUpdate({facebookId: req.session.passport.user.facebookId}, {valid_email: true, email: req.body.email}, 
        function(err, user){
            if (err) {console.log(err); return (err)}
            console.log(user + '   updated');
            res.redirect('/')
        });
    })
    
    //To test user is authentified
    app.get('/testauth', ensureAuthenticated, function(req,res){
        console.log(req.session.passport.user);
        Users.findById(req.session.passport.user, function (err,user){
            if (err) {console.log(err); return err};
            res.send('authentified');
        });
    });

    // To log out
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    })

} //end of the module export
