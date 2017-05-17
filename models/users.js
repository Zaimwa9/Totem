/* In here we will add all the functions as methods to the User model and they will be called in the UserController */

var mongoose=require('mongoose');

var Schema=mongoose.Schema;

var UserSchema = new Schema({
    username: String,
    email: String,
    password: String
});

UserSchema.statics.register= function(data, cb){
     
     var newuser={
       username: data.username,
       email: data.email,
       password: data.password
     };
     console.log('username is ' + data.username);

     if ( !(newuser.password) || newuser.password < 5)
        return cb(new Error('Invalid password, please choose one with at least 6 characters'));
    
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