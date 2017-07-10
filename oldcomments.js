Voir avec le header pour gérer les autorisations => Vue envoie dans le header le username




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


