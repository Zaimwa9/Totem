/* In here we will add all the functions as methods to the User model and they will be called in the UserController */

var mongoose=require('mongoose');
var bcrypt=require('bcrypt');
var SALT_WORK_FACTOR=10;

var Schema=mongoose.Schema;

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    email: String,
    valid_email: Boolean,
    facebookId: String,
    picture: String,
    password: String,
    role: String,
    projects_array: Array,
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


var Users=mongoose.model('Users', UserSchema);

global.Users=Users;

module.exports=Users;


/* This is the first attempt to have a model method to authenticate with classic login
It will be used for the backoffice

UserSchema.statics.login = function (data, cb){
    Users.findOne({username: data.username}, function (err, user){
        console.log(data.username + data.password);
        if (err) return cb(err);
        if (user)
        { 
            if (comparePassword(data.password, user.password, function(err,isMatch){
                console.log(data.password + ' checking');
                if (err) throw err;
            }) == 'true')
            {
              return cb(null, user);
            };
        };

    });
};
*/






/*

Valentin example


UserSchema.statics.register = function(dt_user, source, cb, generateToken) {
  var password = dt_user.password;
  if (typeof (source) === 'function') cb = source;

  if (!password || password.length < 6) return cb(new Error('Invalid password'));

  this.saltPass(dt_user, function (t_user) {
    var db_user = new global._db.User(t_user);

    var error = db_user.validateSync();
    if (error) return cb(error);
    global._db.User.findOne({ $or: [{ email: t_user.email }, { username: t_user.username }] }, function (err, user) {
      if (err) return cb(err);
      if (user && user.email === t_user.email) {
        let error = new Error();
        error.errors = {email: {message: 'Email is already taken, please choose another one'}};
        return cb(error);
      }
      if (user && user.username === t_user.username) {
        let error = new Error();
        error.errors = {username: {message: 'Username is already taken, please choose another one'}};
        return cb(error);
      }

      db_user.save(function (err, db_user) {
        if (err) return cb(err);
        // generate token and return the response
        // (containing user, access_token and refresh_token)
        if (generateToken === true || generateToken === undefined)
          _db.Token.generateOfficial(db_user, cb);
        else
          return cb(err, { user: db_user });
      });
    });
  });
};
*/