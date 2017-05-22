/* In here we will add all the functions as methods to the User model and they will be called in the UserController */

var mongoose=require('mongoose');
var bcrypt=require('bcrypt');
var SALT_WORK_FACTOR=10;

var Schema=mongoose.Schema;

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    email: String,
    password: { type: String, required: true },
    role: String,
    projects_array: Array,
    created_at: Date
});

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

// Create a new user
UserSchema.statics.register= function(data, cb){
     
     var newuser= new Users ({
       username: data.username,
       email: data.email,
       password: data.password,
       role: 'user',
       projects_array: [],
       created_at: new Date().getTime()
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

// password check

UserSchema.method.comparePassword = function(candidatePassword, obj, cb) {
    bcrypt.compare(candidatePassword, obj.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

/*
comparePassword2 = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return err;
        cb(null, isMatch);
    });
};


UserSchema.statics.login = function (data, cb){
    Users.findOne({username: data.username}, function (err, user){
        console.log(data.username + data.password);
        if (err) return cb(err);
        if (user)
        { 
            if (comparePassword2(data.password, user.password, function(err,isMatch){
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

var Users=mongoose.model('Users', UserSchema);

global.Users=Users;

module.exports=Users;





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