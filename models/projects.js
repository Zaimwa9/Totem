/* In here we will add all the functions as methods to the project model and they will be called in the UserController */
// Should we limit the number of projects led by each member ?

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Users = require('./users')

var ProjectSchema = new Schema({
    name: { type: String, required: true, index: { unique: true } },
    leader: { type: String, required: true },
    leader_email: { type: String, required: true },
    members_count: Number,
    members_array: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users'}],
    curious_array: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users'}],
    description: String,
    category: String,
    img: String,
    edition: String,
    geoposition: String,
    active: Boolean,
    created_at: Date
});

// To create a project we'll need: the initial inputs + the creator user object + maybe the members he will add
// In project we should have: project.name, project.leader, project.category, project.description, project.img
ProjectSchema.statics.adding = function(project, user, cb){
    console.log(project);
    console.log(user);
    
    var new_project = new Projects ({
        name: project.name,
        leader: user.username,
        leader_email: user.email,
        members_array: [user._id],
        curious_array: [],
        description: project.description,
        img: '',
        category: project.category,
        edition: 'Totem V',
        active: true,
        created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    });

    Projects.findOne({name:new_project.name}, function(err, db_project){
        if (err) return cb(err);
            if (db_project)
            {
                if (db_project.name === new_project.name) 
                {
                    return cb(new Error('This name is already taken, sorry'));
                }
            };    
    });
    
    Projects.create(new_project, function(err, proj){
        if (err) return cb(err);
        
        return cb(null,proj);
    });
}; //end of projectcreation method


// Here starts the update method (think to check in the controller that only the owner can update)
ProjectSchema.statics.updateproject = function (field_name, old_project_name, new_value, user, cb){
        console.log(old_project);
        console.log(modified_project);
        console.log(user);
/* Le mieux c'est de dire qu'il update qu'un paramètre à la fois. Ce qui signifie qu'on passe un field
   et une nouvelle valeur. via l'id req_body ?
*/
        switch(field_name){
            case 'name':
                Projects.findOneAndUpdate({project: old_project.name}, {name: new_value}, function(err){
                    if (err) return cb(err);
                    console.log(field_name + ' updated');
                    return cb(null, 1)
                });
            break;
            case 'description':
                Projects.findOneAndUpdate({project: old_project.name}, {description: new_value}, function(err){
                    if (err) return cb(err);
                    console.log(field_name + ' updated');
                    return cb(null, 1)
                });
            break;
            case 'category':
                Projects.findOneAndUpdate({project: old_project.name}, {category: new_value}, function(err){
                    if (err) return cb(err);
                    console.log(field_name + ' updated');
                    return cb(null, 1)
                });            
        };
    };

// This method allows a user to join a project as a curious member (show interest)
/*ProjectSchema.statics.newcurious = function(project, user, cb){
    Projects.update({name: project.name}, {$push: {curious_array: user._id}}, function(err, updated_project){
        console.log(user._id + 'user_id');
        if (err) return cb(err);
        console.log('project method:  ' + project);
        console.log('array attempt:  ' + project.members_array)
        return cb(null, updated_project); 
    });
}; */
ProjectSchema.methods.addCurious = function(user, cb){
    this.curious_array.push(user._id);
    this.save(cb); 
};

ProjectSchema.methods.removeCurious = function(user, cb){
    this.curious_array.push(user._id);
    this.save(cb); 
};

var Projects=mongoose.model('Projects', ProjectSchema);

global.Projects=Projects;

module.exports=Projects;