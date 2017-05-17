/* This is kind of useless but i already coded it so whatever, it's to create a first profile ahah */

var Users= require('../models/users');

module.exports=function(app) {

    app.get('/setupdb', (req,res)=>{

        var firstuser=[
            {
                username: 'zazaimwa',
                email: 'wadii.zaim@hotmail.fr',
                password: 'test123'
            }];

        Users.count().exec((err, count) => {
            if (err) return res.status(500).send(err);
            if (count > 0) return res.send(`Database already existing with ${count} documents`);

        Users.create(firstuser, (err, results) => {
            return err ? res.status(500).send(err) : res.send(`Adding default done`);
            });
        });
    });
}