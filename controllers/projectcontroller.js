var Projects = require('../models/projects')
var bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({ extended: false })
// var jsonParser = bodyParser.json(); // Same but parses Json objects
var fs = require('fs')
var multer = require('multer')
var moment = require('moment')
var mailgun = require('./mailfunctions')
var Users = require('../models/users')
var path = require('path')
// var type = upload.single('image'
// Functions that triggers the facebook log in on specific routes to force authentication
function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    console.log('access granted')
    return next()
  }
  console.log('denied')
  res.redirect('/auth/facebook')
}

module.exports = function (app) {
  var upload = multer({
    dest: path.join(__dirname, '../public/uploads/')
  })
  var type = upload.single('image')

    // Renders the page to create and add a new project
  app.get('/newprojectpage', ensureAuthenticated, function (req, res) {
    (req.isAuthenticated) ? res.render('newproject.ejs') : res.send('not auth')
  })

    // Renders what will be the browsing page
  app.get('/projectlist', function (req, res) {
    Projects.find({ $and: [{ edition: 'Totem V', active: true }] }, ['name', 'leader', 'members_count', 'created_at'], { sort: { created_at: -1 } }
    , function (err, results, count) {
      if (err) return err
      console.log(results.length)
      res.render('allprojects.ejs', { projects: results, count: results.length })
    })
  })

    // Renders individual project pages
  app.get('/projects/:projectId', function (req, res) {
    Projects.findOne({ _id: req.params.projectId })
      .populate('members_array')
      .populate('curious_array')
      .populate('pending_members')
      .exec(function (err, project) {
        if (err) return err
        if (req.isAuthenticated()) {
        // This takes the curious array of a project, maps it and checks if it contains the id of the user session
          var isCurious = project.curious_array.map(object => object._id).some(id => id.toString() === req.session.passport.user._id.toString())
          console.log(project.curious_array.map(object => object._id));
          return res.render('singleprojectpage', { auth: req.isAuthenticated(), isCurious: isCurious, project: project, count_members: project.members_array.length, count_curious: project.curious_array.length, moment: moment, user: req.session.passport.user })
        } else {
          let visitor = { username: ' ' }
          return res.render('singleprojectpage', { auth: req.isAuthenticated(), isCurious: false, project: project, count_members: project.members_array.length, count_curious: project.curious_array.length, moment: moment, user: visitor });
        }
      })
  })
    // ALL POST-REQUEST HANDLERS ARE DOWN HERE
    // Handles the post request when adding a new project
  app.post('/newproject', urlencodedParser, type, function (req, res) {
    var currentProj = req.body
    var targetPath = path.join(__dirname, '/../public/uploads/', req.file.originalname)
    // Saves in the database the path to the image
    var dbImage = '/assets/uploads/' + req.file.originalname
    global.Projects.adding(currentProj, req.session.passport.user, dbImage, function (err, proj) {
      if (err) return res.send(err)
      // Initiate the stream pipe
      var src = fs.createReadStream(req.file.path)
      var dest = fs.createWriteStream(targetPath)
      src.pipe(dest)
            // Once the upload is complete, this pushes the new project into the user project_array
      src.on('end', function () {
        Users.findOneAndUpdate({username: req.session.passport.user.username}, {$push: {projects_array: currentProj.name}}, function (err, user) {
          if (err) return err
          res.send(proj + ' saved and user modified' + user)
        })
      })
    })
  })
    // Here we will handle the application to join a project that will send an email to the leader of the project
    // This consists in sending an email to the leader
    // Next step: add a waiting list on both sides that will require validation (kind of add a friend on linkedin)
  app.post('/projects/:projectId/application', function (req, res) {
    if (req.body.application.length < 10) {
      return res.send('Please insert a text')
    }
    Projects.findOne({ _id: req.params.projectId }, function (err, dbProj) {
      if (err) return err
      var user = req.session.passport.user
      if (dbProj.pending_members.some(members => members === user._id) || dbProj.pending_members.some(members => members === user._id)) {
        console.log('already involved')
        return res.send('already involved')
      }
      var obj = {
        leader: dbProj.leader,
        email_to: dbProj.leader_email,
        applicant: req.session.passport.user.username,
        project: req.params.projectname,
        body: req.body.application
      }
      mailgun.applyProject(obj, function (err, cb) {
        if (err) return err
        console.log('mail sent' + cb)
      })
      dbProj.addPending(req.session.passport.user, function (err, cb) {
        if (err) return err
        console.log('new pending')
        res.redirect('/projects/dbProj._id')
      })
    })
  })
  // Post method accepting an applicant as a new membe
  app.post('/projects/:projectId/:userId/accept', function (req, res) {
    Projects.findOne({ _id: req.params.projectId }, function (err, dbProj) {
      if (err) return err
      dbProj.acceptPending(req.params.userId, function () { 
        console.log('successfuly accepted member')
        res.redirect('/')
      })
    })
  })
  // Post method to decline a membership application
  app.post('/projects/:projectId/:userId/decline', function (req, res) {
    Projects.findOne({ _id: req.params.projectId }, function (err, dbProj) {
      if (err) return err
      dbProj.declinePending(req.params.userId, function () {
        console.log('successfuly declined member')
        res.redirect('/')
      })
    })
  })
  // This part uses the projectname to delete the project. Actually it just sets to false the "active" field
  app.post('/projects/:projectId/delete', (req, res) => {
  // Projects.remove({name: req.params.projectname}
    Projects.update({ _id: req.params.projectId }, { active: false }, function (err) {
      if (err) {
        console.log(err)
        return err
      }
      console.log('Document removed')
      res.send('Project deleted ' + req.params.projectId)
    })
  })

    // This handles the post request to become curious about the project
  app.post('/projects/:projectId/newcurious', function (req, res) {
    Projects.findOne({ _id: req.params.projectId }, function (err, dbProj) {
      if (err) return err
      dbProj.addCurious(req.session.passport.user, function (err, cb) {
        if (err) return err
        console.log(cb + 'updated')
        res.redirect('/projects/' + dbProj._id)
      })
    })
  })

    // Same but removing a curious member
  app.post('/projects/:projectId/removecurious', function (req, res) {
    Projects.findOne({ _id: req.params.projectId }, function (err, dbProj) {
      if (err) return err
      dbProj.removeCurious(req.session.passport.user, function (err, cb) {
        if (err) return err
        console.log(cb + 'updated')
        res.redirect('/projects/' + dbProj.id)
      })
    })
  })
}
// end of the module export
