var express=require('express');
var app=express();
var config=require('./config');
var Users=require('./models/users.js');
var mongoose=require('mongoose');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
const session = require('express-session');

// require controllers
var usercontroller=require('./controllers/usercontroller.js');
var setupcontroller=require('./controllers/setupcontroller.js')

var port=process.env.PORT || 3000;

mongoose.connect(config.getDbConnectionstring(),function(){
        console.log('Successfuly connected')
        });

app.use(session({
        key: 'session',
        secret: 'helloworld123',
        store: require('mongoose-session')(mongoose)
}));

var sess;

app.use('/assets', express.static(__dirname+'/public')); //this exposes the public folder to serve static files

app.use(bodyParser({extended: true}));

app.use(expressValidator());

app.set('view engine', 'ejs');

usercontroller(app);

setupcontroller(app);

app.listen(port);