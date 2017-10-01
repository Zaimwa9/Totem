/* In here we will add all the functions as methods to the project model and they will be called in the UserController */
// Should we limit the number of projects led by each member ?

var mongoose = require('mongoose')
var Schema = mongoose.Schema
// var Users = require('./users')

var ProjectSchema = new Schema({
  name: { type: String, required: true, index: { unique: true } },
  leader: { type: String, required: true },
  leader_email: { type: String, required: true },
  members_count: Number,
  members_array: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  curious_array: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  pending_members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
  description: String,
  category: String,
  img: String,
  edition: String,
  geoposition: String,
  active: Boolean,
  created_at: Date
})

// To create a project we'll need: the initial inputs + the creator user object + maybe the members he will add
// In project we should have: project.name, project.leader, project.category, project.description, project.img
ProjectSchema.statics.adding = function (project, user, imagePath, cb) {
// console.log(project)
// console.log(user)
  var newProject = new Projects({
    name: project.name,
    leader: user.username,
    leader_email: user.email,
    members_array: [user._id],
    pending_members: [],
    curious_array: [],
    description: project.description,
    img: imagePath,
    category: project.category,
    edition: 'Totem V',
    active: true,
    created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
  })
  Projects.findOne({name: newProject.name}, function (err, dbProject) {
    if (err) return cb(err)
    if (dbProject) {
      if (dbProject.name === newProject.name) {
        return cb(new Error('This name is already taken, sorry'))
      }
    }
  })
  Projects.create(newProject, function (err, proj) {
    if (err) return cb(err)
    return cb(null, proj)
  })
} // end of projectcreation method
// Here starts the update method (think to check in the controller that only the owner can update)
ProjectSchema.statics.updateproject = function (actionType, oldName, newName, user, cb) {
  console.log(oldName)
  console.log(user)
  switch (actionType) {
    case 'name':
      Projects.findOneAndUpdate({project: oldName}, {name: newName}, function (err) {
        if (err) return cb(err)
        console.log(actionType + ' updated')
        return cb(null, 1)
      })
      break
    case 'description':
      Projects.findOneAndUpdate({project: oldName}, {description: newName}, function (err) {
        if (err) return cb(err)
        console.log(actionType + ' updated')
        return cb(null, 1)
      })
      break
    case 'category':
      Projects.findOneAndUpdate({project: oldName}, {category: newName}, function (err) {
        if (err) return cb(err)
        console.log(actionType + ' updated')
        return cb(null, 1)
      })
  }
}

ProjectSchema.methods.addCurious = function (user, cb) {
  this.curious_array.push(user._id)
  this.save(cb)
}

ProjectSchema.methods.removeCurious = function (user, cb) {
  var index = this.curious_array.indexOf(user._id)
  if (index > -1) {
    this.curious_array.splice(index, 1)
    this.save(cb)
  }
}

ProjectSchema.methods.addPending = function (user, cb) {
  this.pending_members.push(user._id)
  this.save(cb)
}

ProjectSchema.methods.acceptPending = function (userId, cb) {
  this.members_array.push(userId)
  var index = this.pending_members.indexOf(userId)
  if (index > -1) {
    this.pending_members.splice(index, 1)
  }
  this.save(cb)
}

ProjectSchema.methods.declinePending = function (userId, cb) {    
  var index = this.pending_members.indexOf(userId)
  if (index > -1) {
    this.pending_members.splice(index, 1)
  }
  this.save(cb)
}
// Here will go the post method following a application acceptation (leader side);

var Projects = mongoose.model('Projects', ProjectSchema)

global.Projects = Projects

module.exports = Projects
