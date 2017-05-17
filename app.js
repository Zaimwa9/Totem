var express=require('express');
var app=express();
var config=require('./config');
var Users=require('./models/users.js');
var mongoose=require('mongoose');
var usercontroller=require('./controllers/usercontroller.js');
var setupcontroller=require('./controllers/setupcontroller.js')

var port=process.env.PORT || 3000;

app.use('/assets', express.static(__dirname+'/public')); //this exposes the public folder to serve static files

app.set('view engine', 'ejs');

mongoose.connect(config.getDbConnectionstring(),function(){
        console.log('Successfuly connected')
        });

//Serves the landing page
app.get('/', (req,res) => { 
        res.render('index.ejs');
});
//Serves the signin page (could be included as client-side Javascript no ?)

app.get('/signin', (req,res) => {
        res.render('signin.ejs')
});

usercontroller(app);
setupcontroller(app);

app.listen(port);