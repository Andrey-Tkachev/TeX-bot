var fs          = require('fs'); // file-system
var path        = require('path'); // for paths generating
var log         = require('./log')(module);

function createFolder(_path) {
  fs.mkdir(_path,function(err){
    if(!err || (err && err.code === 'EEXIST')){
        log.info(_path + ' init succsesed.');
    } else {
        log.error(err);
    }
  });
}

module.exports.createFolder = createFolder;
