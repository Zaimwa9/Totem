//here we will process all the requests concerning the users
//Meaning each time a request involve an action on the user it will be sent here and processed

var Users= require('../models/users');
var bodyParser=require('body-parser');

var urlencodedParser=bodyParser.urlencoded({extended:false}); // this part is used being passed as a callback in the post statements
var jsonParser=bodyParser.json(); // Same but parses Json objects


module.exports=function(app){
    
    //Serves the landing page
    app.get('/', (req,res) => { 
            res.render('index.ejs');
    });

    //Serves the signin page (could be included as client-side Javascript no ?)
    app.get('/signin', (req,res) => {
            res.render('signin.ejs')
    });

    //This part handles the signin and user creation
    app.post('/newuser', urlencodedParser, function(req,res){
        
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
            return res.send('woops already loggedin' + sess.username)
        }
        return res.render('login.ejs')
    });

    app.post('/loginform', urlencodedParser, function(req,res){
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
                if (err) throw err;
                if (!user) {return res.send('No user like this known')};
                
                Users.comparePassword(req.body.password, user, function(err, isMatch){
                    if (err) throw err;
                    console.log(isMatch);
                    if (isMatch) {
                        sess.username = user.username ;
                        return res.send('Logged in');
                    }
                    else
                    {
                        return res.send('sorry, wrong password: '+ req.body.password);
                    }
                });
            }) //end of findOne
        };
    }); // end of the post


app.get('/session', function(req,res){
    console.log(sess);
    if (sess.username) {return res.send(sess.username + " hello")};
})


} //end of the module export
