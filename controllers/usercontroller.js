//here we will process all the requests concerning the users
//Meaning each time a request involve an action on the user it will be sent here and processed

var Users= require('../models/users');
var bodyParser=require('body-parser');

var urlencodedParser=bodyParser.urlencoded({extended:false}); // this part is used being passed as a callback in the post statements
var jsonParser=bodyParser.json(); // Same but parses Json objects


module.exports=function(app){
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
        
        /* Will include a typo check to verify that email is an email etc ...
        /* This means:
1) parse the json object sent from the form
2) save it to the database (and encrypt the password if possible)
3) say thanks and redirect the guy to the main logged in page
*/
        /*res.send('Thank you!');
        console.log(req.body.username);
        console.log(req.body.email);
        console.log(req.body.password);*/
    });
}