var conf=require('./config.json');

module.exports={
    getDbConnectionstring: function(){
        return 'mongodb://'+conf.user + ':' +conf.pwd+conf.serv
    }
}