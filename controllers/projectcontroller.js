//here we will process all the requests concerning the users
//Meaning each time a request involve an action on the user it will be sent here and processed

var Projects= require('../models/projects');
var bodyParser=require('body-parser');

var urlencodedParser=bodyParser.urlencoded({extended:false}); // this part is used being passed as a callback in the post statements
var jsonParser=bodyParser.json(); // Same but parses Json objects


module.exports=function(app){

// First page to create a new project
    app.get('/newprojectpage', function(req,res){
        res.render('newproject.ejs')
    });
    
    app.post('/newproject', urlencodedParser, function(req,res){
        sess=req.session;
        current_proj=req.body;
        console.log(req.body);
        global.Projects.adding(current_proj, 'wadii', function(err, proj){
            if (err) return res.send(err);
            res.send(proj + ' saved');
        });
    });

} //end of the module export
