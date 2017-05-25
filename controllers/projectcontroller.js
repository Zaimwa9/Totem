//here we will process all the requests concerning the users
//Meaning each time a request involve an action on the user it will be sent here and processed

var Projects = require('../models/projects');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false}); // this part is used being passed as a callback in the post statements
var jsonParser = bodyParser.json(); // Same but parses Json objects
var fs = require('fs')
var busboy = require('connect-busboy');


function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { console.log('authenticated'); return next(); }
        console.log('denied');
        res.redirect('/auth/facebook');
}



module.exports=function(app){

    app.use(busboy());
// First page to create a new project
    app.get('/newprojectpage', ensureAuthenticated ,(req,res) => {
        (req.isAuthenticated) ? res.render('newproject.ejs') : res.send('not auth')
        /*if (req.isAuthenticated) {res.render('newproject.ejs')} else {
        res.send('not auth')} */
    });
    
    app.post('/newproject', urlencodedParser, (req,res) => {
        current_proj=req.body;

        global.Projects.adding(current_proj, req.session.passport.user , function(err, proj){
            if (err) return res.send(err);
            res.send(proj + ' saved');
        });
    });

    app.get('/projectlist', (req,res) => {
        Projects.find({edition : 'Totem V'}, ['name', 'leader', 'members_count', 'img'], { sort: {date_added: -1}}, function (err, results){
            if (err) return err;
            res.send(results)
        });
    });



// update a new project
/*
    app.post('/project/:projectname/:username/update', urlencodedParser, (req,res) => {
        sess=req.session;
            if (req.body.name)
        // here pass the elements to an update method

    }) // end of the post update
*/
    /*
    // On routes where bucket_id param is set, we validate the user is authorized before loading it
  bucketRouter.param('bucket', function(req, res, next, bucket_id) {
    if (!mongoose.Types.ObjectId.isValid(bucket_id))
      return res.status(403).send({msg: "Invalid bucket ID"})

    auth.ensureAuthorizedAccessToBucket(req, res, function(err) {
      if (err) return next(err);

      ctrl.bucketController.load(req, res, next);
    });
  });
  */

} //end of the module export
