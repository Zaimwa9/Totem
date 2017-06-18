//here we will process all the requests concerning the users
//Meaning each time a request involve an action on the user it will be sent here and processed

var Projects = require('../models/projects');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false}); // this part is used being passed as a callback in the post statements
var jsonParser = bodyParser.json(); // Same but parses Json objects
var fs = require('fs');
var multer = require('multer');
var moment = require('moment');
var mailgun = require('./mailfunctions');
var Users= require('../models/users');

function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { console.log('access granted'); return next(); }
        console.log('denied');
        res.redirect('/auth/facebook');
}


module.exports=function(app){

    var upload = multer({
        dest: __dirname + '../public/uploads/' 
    }); 
    var type = upload.single('image');

// First page to create a new project
    app.get('/newprojectpage', ensureAuthenticated , (req, res) => {
        (req.isAuthenticated) ? res.render('newproject.ejs') : res.send('not auth')
        /*if (req.isAuthenticated) {res.render('newproject.ejs')} else {
        res.send('not auth')} */
    });
     
    app.post('/newproject', urlencodedParser, (req, res) => {
        current_proj=req.body;

        global.Projects.adding(current_proj, req.session.passport.user, function(err, proj){
            if (err) return res.send(err);
            Users.findOneAndUpdate({username: req.session.passport.user.username}, {$push: {projects_array : current_proj.name}}, function (err, user){
            if (err) return err
            res.send(proj + ' saved and user modified'+ user)
            });
        });
    });

    app.post('/projects/image/:projectid', type, (req, res) => {
        console.log(req.file);
        var target_path = `Tester/`+ req.file.originalname;

        Projects.update({_id: req.params.projectid}, {img: target_path}, function(err, db_project) {
            if (err) return (err);
        })

        // original name of the file + destination
        
        //var target_path = '../public/uploads/' + req.file.originalname;
        //source path of the stream
        var src = fs.createReadStream(req.file.path);
        var dest = fs.createWriteStream(target_path);

        src.pipe(dest);
        
        //listens on events end/error to send response
        src.on('end', function() {
            res.send('complete');});
        src.on('error', function(err) {
            res.send('error');});
        
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

    app.get('/projects/:projectid', ensureAuthenticated, (req, res) => {
        Projects.findOne({_id: req.params.projectid})
        .populate('members_array')
        .populate('curious_array')
        .exec(function (err, project){
            if (err) return err;
            if (req.isAuthenticated)
            {   
                isCurious = project.curious_array.map(object => object._id).some(id => id.toString() == req.session.passport.user._id.toString())
                console.log(req.session.passport.user._id + ' session passport');
                console.log(project.curious_array.map(object => object._id));
                console.log(isCurious);

                res.render('singleprojectpage', {auth: req.isAuthenticated(), isCurious: isCurious, project: project, count_members: project.members_array.length, count_curious: project.curious_array.length, moment: moment, user: req.session.passport.user});
            }
            else 
            { 
                res.render('singleprojectpage', {auth: req.isAuthenticated(), project: project, count_members: project.members_array.length, count_curious: project.curious_array.length, moment: moment});
            }
        })
    });

    //Here we will handle the application to join a project that will send an email to the leader of the project
    //Will be nice to have a thank you note popping (@Dorian)

    app.post('/projects/:projectid/application', (req, res) => {
        if (req.body.application.length < 10){
            return res.send('please insert a text');
        }
        Projects.findOne({_id: req.params.projectid}, function(err, db_proj){
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
    app.post('/projects/:projectid/delete', (req, res) => {
            //Projects.remove({name: req.params.projectname}, 
            Projects.update({_id: req.params.projectid}, {active: false}, function (err){
            if (err) {console.log(err); return err;}
            console.log('Document removed');
            res.send('Project deleted ' + req.params.projectid)
        });
    });

// This handles the post request to become curious about the project
    app.post('/projects/:projectid/newcurious', (req, res) => { 
        Projects.findOne({_id: req.params.projectid}, function (err, db_project){
            db_project.addCurious(req.session.passport.user, function(err, cb){
                if (err) return (err);
                console.log(cb + 'updated');
                res.redirect('/projects/'+ db_project.name);
            }) 
        });
    });

    app.post('/projects/:projectid/removecurious', (req, res) => { 
        Projects.findOne({_id: req.params.projectid}, function (err, db_project){
            db_project.removeCurious(req.session.passport.user, function(err, cb){
                if (err) return (err);
                console.log(cb + 'updated');
                res.redirect('/projects/'+ db_project.name);
            });
        });
    });

} //end of the module export
