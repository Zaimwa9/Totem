//here we will process all the requests concerning the users
//Meaning each time a request involve an action on the user it will be sent here and processed

var Projects = require('../models/projects');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false}); // this part is used being passed as a callback in the post statements
var jsonParser = bodyParser.json(); // Same but parses Json objects
var fs = require('fs')
var busboy = require('connect-busboy');
var moment = require('moment');
var mailgun = require('./mailfunctions');
var Users= require('../models/users');

function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { console.log('access granted'); return next(); }
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
            Users.findOneAndUpdate({username: req.session.passport.user.username}, {$push: {projects_array : current_proj.name}}, function (err, user){
            if (err) return err
            res.send(proj + ' saved and user modified'+ user)
            });
        });
    });

    app.get('/projectlist', (req,res) => {
        Projects.find({$and: [{edition : 'Totem V', active: true}]}, ['name', 'leader', 'members_count', 'created_at'], { sort: {created_at: -1}}, function (err, results, count){
            if (err) return err;
            console.log(results.length);
            res.render('allprojects.ejs', {projects: results, count: results.length} )
        });
    }); 
/*  Projectlist version populating members_array. Will depend whether we need it in a future version

    app.get('/projectlist', (req,res) => {
        Projects.find({edition : 'Totem V', active: true}, 
        ['name', 'leader', 'members_count', 'created_at'], 
        { sort: {created_at: -1}})
        .populate(members_array)
        .exec(function (err, results, count){
            if (err) return err;
            console.log(results.length);
            res.render('allprojects.ejs', {projects: results, count: results.length} )
        });
    });
*/    

    app.get('/projects/:projectname', ensureAuthenticated, (req, res) => {
        Projects.findOne({name: req.params.projectname})
        .populate('members_array')
        .exec(function (err, project){
            if (err) return err;
            if (req.isAuthenticated)
            {   console.log(project);
                res.render('singleprojectpage', {auth: req.isAuthenticated(), project: project, count_members: project.members_array.length, moment: moment, user: req.session.passport.user});
            }
            else 
            { 
                res.render('singleprojectpage', {auth: req.isAuthenticated(), project: project, count_members: project.members_array.length, moment: moment});
            }
        })
    });

    //Here we will handle the application to join a project that will send an email to the leader of the project
    //Will be nice to have a thank you note popping (@Dorian)

    app.post('/projects/:projectname/application', (req, res) => {
        if (req.body.application.length < 10){
            return res.send('please insert a text');
        }
        Projects.findOne({name: req.params.projectname}, function(err, db_proj){
            var obj = {
                leader: db_proj.leader,
                email_to: db_proj.leader_email,
                applicant: req.session.passport.user.username,
                project: req.params.projectname,
                body: req.body.application,
            }
        mailgun.applyProject(obj, function(err, cb){
            if (err) return err;
            console.log('mail sent' + cb);
            res.send('Application sent');
            })
        });
    });

    app.get('/updatewadii', (req, res) => {
        Projects.update({}, {leader_email: 'B00549848@essec.edu'}, {multi: true},
        function(err,user){
            if (err) return err;
            res.send(user);
        });
    });

// This part uses the projectname to delete the project. Actually it just sets to false the "active" field
    app.post('/projects/:projectname/delete', (req, res) => {
            //Projects.remove({name: req.params.projectname}, 
            Projects.update({name: req.params.projectname}, {active: false}, function (err){
            if (err) {console.log(err); return err;}
            console.log('Document removed');
            res.send('Project deleted ' + req.params.projectname)
        });
    });
/*
    app.post('/projects/:projectname/curious', (req, res) => { 
        Projects.find({name: req.params.projectname}, function (err, db_project){
            console.log(db_project + '   db');
            Projects.newcurious(db_project, req.session.passport.user, function(err, cb){
                if (err) return (err);
                res.send(JSON.stringify(cb) + 'updated');
            })
        })
    })
*/
app.post('/projects/:projectname/newcurious', (req, res) => { 
        Projects.findOne({name: req.params.projectname}, function (err, db_project){
            db_project.addCurious(req.session.passport.user, function(err, cb){
                if (err) return (err);
                console.log(cb + 'updated');
                res.send('updated');
            }) 
        })
    })


/*
statics fourni des méthodes sans instance
si tu ajoutes des functions dans `Schema.methods` elle seront ajouter que quand tu query l'object en db

[10:56] 
et tu pourras utiliser des `this` pour referer au data dans l'object
*/


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
