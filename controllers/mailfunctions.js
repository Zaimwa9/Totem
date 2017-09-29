// This "controller" processes any action requiring to send an email with mailgun

var configMg = require('../gmail_keys/mailgun.json')
var mailgun = require('mailgun-js')({ apiKey: configMg.active_key, domain: 'humantour.ist' })

var Mailcommands = {}

// This will trigger an email to a project leader any time a member applies to join the project
Mailcommands.applyProject = function (obj, cb) {
  console.log('Application email about to be sent')
  console.log(obj)

// Creates the object that will be passed to mailgun built-in function
  var data =
    {
      from: 'Totem festival <b00549848@essec.edu>',
      to: obj.email_to,
      subject: 'Hello ' + obj.leader + ': un nouveau membre ? (' + obj.applicant + ')',
      text: 'Salut ! ' + obj.applicant + ' veut rejoindre ton projet: ' + obj.project + '. Voila son message: ' + obj.body
    }
  mailgun.messages().send(data, function (err, body) {
    if (err) return cb(err)
    console.log('Mail sent was: ' + body)
    return cb(null, body)
  })
}

module.exports = Mailcommands
