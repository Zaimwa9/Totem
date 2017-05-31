var configMg = require('../gmail_keys/mailgun.json');
var mailgun=require('mailgun-js') ({apiKey: configMg.active_key, domain: 'humantour.ist'});

module.exports=function(app){
    console.log('starting')
    var data = {
        from: 'Totem festival <b00549848@essec.edu>',
        to: 'B00549848@essec.edu',
        subject: 'Hello world',
        text: 'Test Test'
    };

    mailgun.messages().send(data, function (err, body){
        console.log(body);
    });
}