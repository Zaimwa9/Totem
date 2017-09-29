/* In here we will add all the functions as methods to the User model and they will be called in the UserController */

var mongoose=require('mongoose');
var bcrypt=require('bcrypt');
var SALT_WORK_FACTOR=10;
var Projects = require('./projects.js');

var Schema=mongoose.Schema;

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    email: String,
    valid_email: Boolean,
    facebookId: String,
    picture: String,
    password: String,
    role: String,
  //projects_array: Array,
    created_at: Date
});



// This part is called when authenticating to facebook. If the user exists then it logs him and goes on
// If this is the first time a user logs in then it creates a record in the database using facebook information
UserSchema.statics.findOrCreatefb = function(profile, cb){

    console.log('Checking facebook authentication');

    Users.findOne({facebookId: profile.id}, function (err, user){
        if (err) return cb(err);

        if (user) {console.log('user found'); return cb(null,user)};

        user= new Users ({
            username: profile.displayName,
            facebookId: profile.id,
            role: 'user',
            valid_email: false,
            picture: profile.photos[0].value,
            created_at: new Date().getTime()
        });

        user.save(function (err){
            if (err) return err;
            console.log(user + ' saved')
        });
    });
}

//A quick function to call each time you want to check if the guy has an email address
UserSchema.statics.checkmail = function (user,cb) {
    console.log('checking if email is correct');

    Users.findOne({facebookId: user.facebookId}, function (err,db_user){
        if (err) return cb(new Error('user not found'));

        if (!db_user.valid_email) return cb(null, false);
    
        if (db_user.valid_email) return cb(null, true);
    });
}


// Removing user from everywhere in the database A TESTER ABSOLUMENT (Pas sur à 100% que ça marche as of)
UserSchema.statics.deleteAccount = function (user, cb) {
    Users.findOneAndRemove(user._id, function(err){
        console.log('removed from user database');
    });
    
    Projects.find({members_array: user._id}, function (err, docs){
        if(docs){
            docs.forEach(function(doc){
                var index = doc.indexOf(user._id)
                if (index > -1) {
                    let new_array = docs.members_array.splice(index, 1);
                    Projects.update({_id: doc._id}, {members_array: new_array}, function(err, result){
                        console.log('removed from member arrays')
                    })
                }
            })  
        }
    })

    Projects.find({curious_array: user._id}, function (err, docs){
        if(docs){
            docs.forEach(function(doc){
                var index = doc.indexOf(user._id)
                if (index > -1) {
                    let new_array = docs.curious_array.splice(index, 1);
                    Projects.update({_id: doc._id}, {curious_array: new_array}, function(err, result){
                        console.log('removed from curious arrays')
                    })
                }
            })    
        }
    })
 
    Projects.find({pending_members: user._id}, function (err, docs){
        if(docs){
            docs.forEach(function(doc){
                var index = doc.indexOf(user._id)
                if (index > -1) {
                    let new_array = docs.pending_members.splice(index, 1);
                    Projects.update({_id: doc._id}, {pending_members: new_array}, function(err, result){
                        console.log('removed from pending arrays')
                    })
                }
            })  
        }
    })

    Projects.find({leader: user.username}, function (err, docs){
        if(docs){
            docs.forEach(function(doc){
                Projects.findOneAndRemove({_id: doc._id}, function(err, cb){
                console.log('leading projects removed')   
                })
            })  
        }
    })

}

//encrypting the password using a middleware
UserSchema.pre('save', function (next) {
      var User=this;
      // only hash the password if it has been modified (or is new)
      // Boolean to check if any modification
      console.log(User.isModified('password') + 'password checking');
      if (!User.isModified('password')) return next();

      //generate a salt using bcrypt
      bcrypt.genSalt(SALT_WORK_FACTOR, function (err,salt){
          if (err) return next(err);
          console.log('hashing');
          // hash the password with the new salt
          bcrypt.hash(User.password, salt, function(err,hash){
              if (err) return next(err);

              //override the cleartext password with the hashed one
              User.password=hash;
              next();
          });
        });
});

// Method to create a new user with a classic authentification way
// Will be used for admin
UserSchema.statics.register= function(data, cb){
     
     var newuser= new Users ({
       username: data.username,
       email: data.email,
       password: data.password,
       role: 'user',
       projects_array: [],
       created_at: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
     });
     console.log('username is ' + data.username);
    
     Users.findOne( {$or: [{ email: newuser.email }, { username: newuser.username }]}, function(err,user){
        if (err) return cb(err);
        if (user) {
              if (user.username===newuser.username) return cb(new Error('Username already exists, please select a new one'))
              
              if (user.email===newuser.email)   return cb(new Error('Email already exists, please select a new one'))
              };
         
     Users.create(newuser, function(err, user){
        if (err) return cb(err);

        return cb(null, user);

         });
    });
};

// Crypted password method to authenticate with classic login

UserSchema.statics.comparePassword = function(candidatePassword, obj, cb) {
    bcrypt.compare(candidatePassword, obj.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
// Replacing the projects_array field with a function that returns an array
UserSchema.statics.activeprojects = function(user, cb){
    Projects.find({members_array: user._id, active: true}, function (err, projects_array){
        if (err) return cb(err);
        console.log(projects_array);
        return cb(null, projects_array);
    });
};



var Users = mongoose.model('Users', UserSchema);

global.Users=Users;

module.exports=Users;







