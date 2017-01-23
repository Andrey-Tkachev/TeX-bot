// import bot framework
var TelegramBot = require('node-telegram-bot-api');

// import libs for work with system
var fs          = require('fs'); // file-system
var path        = require('path'); // for paths generating
var sizeOf      = require('image-size');
var log         = require('./libs/log')(module);
var config      = require('./libs/config');
var url         = require('url');
var http        = require('http');
var thumb       = require('node-thumbnail').thumb;
var spawn       = require('child_process').spawn; // for bash scripts running

const token     = config.get('token');
var bot = new TelegramBot(token, { polling: true });

// Temporary files options
const tex_dir = config.get('tex-dir');
const images_dir = config.get('images-dir');
const images_ext = config.get('images-ext');
const images_res = config.get('resolution');

function createFolder(_path) {
  fs.mkdir(_path,function(err){
    if(!err || (err && err.code === 'EEXIST')){
        log.info(_path + ' init succsesed.');
    } else {
        log.error(err);
    }
  });
}

log.info('Init of needed folders.');
createFolder(images_dir);
createFolder(tex_dir);

// File server options
const server_ip = config.get('ip');
const domain_name = config.get('domain');
const server_port = config.get('static-port');

// Server to images for inline mode
http.createServer(function (req, res) {
  log.info(`${req.method} ${req.url}`);
  // parse URL
  const parsedUrl = url.parse(req.url);
  // extract URL path
  var filename = `.${parsedUrl.pathname}`;
  var pathname = path.join(images_dir, filename);
  // maps file extention to MIME types
  const mimeType = {
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };
  fs.exists(pathname, function (exist) {
    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      log.warn('Unexisted file was requested.');
      return;
    }

    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
        log.error('Error during file reading.');
      } else {
        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext;
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });
}).listen(server_port);
log.info(`File server listening on port ${server_port}.`);


// Bot's messages wich will be sended to users
const messages = config.get('bot-messages');

// Program wich should convert Latex in pictures
const tex2im_ex = config.get('tex2im');

// Listen for tex command with LaTeX string as arguments
bot.onText(/\/tex (.+)/, _simpleQueryProcessing);

// Listen for message in Inline Mod
bot.on('inline_query', _inlineQueryProcessing);

function isValidTeX(data) {
  return (data != '');
}

function tex2png(data, filename, callback) {
  var path2preprocess = path.join(tex_dir, filename + '.tex');
  fs.writeFile(path2preprocess, data, function (err) {
      if (err) return log.error(err);
      var path2res = path.join(images_dir, filename + '.' + images_ext);
      var tex2im = spawn(tex2im_ex, ['-r', images_res, '-a',
                                     '-o', path2res,
                                     '-f', images_ext,
                                      path2preprocess], {stdio:'inherit'});

      tex2im.on('error', function(err){
        log.error('parentError:', err);
      });

      tex2im.on('close', (code) => {
        log.info(`child process exited with code ${code}.`);
        fs.exists(path2res, function (exists) {
            if (exists) {
              callback(path2res);
            }
        });
      });
  });
}

function inlineQueryResultPhotoFactory(id, photo_url, thumb_url, sizes) {
  return {
    type: 'photo',
    id: id,
    photo_url: photo_url,
    thumb_url: thumb_url,
    photo_width: sizes.width,
    photo_height: sizes.height
  }
}

function _simpleQueryProcessing(msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  // name of res file without extension
  log.info('Simple query.');
  var filename  = msg.message_id;
  var data = match[1];
  var chatId = msg.chat.id;
  // create file with message as content
  tex2png(data, filename, function (path2res) {
    bot.sendPhoto(chatId, path2res, {
        caption: messages['send-photo']
    });
  });
}

function _inlineQueryProcessing(query) {
  log.info('Inline query.');
  var queryId = query.id;
  var filename = query.id + '_inline';
  var data = query.query;
  if (!isValidTeX(data)) {
    log.warn('Data is incorrect.');
  }
  tex2png(data, filename, function (path2res) {
    sizeOf(path2res, function (err, dimensions) {
      if (!err) {
        log.error('Error during dimensions extraction.');
        return;
      }
      thumb_name = filename + '_thumb';
      thumb_dim = { width: Math.floor(dimensions.width / 10),
                    height: Math.floor(dimensions.height / 10)}
      thumb({
          source: path2res,
          destination: images_dir,
          concurrency: 3,
          basename: filename,
          width: thumb_dim.width,
          height: thumb_dim.height
            }, function(err) {
        if (!err) {
          log.info('Thumb created.');
          var resUrl = `${domain_name}:${server_port}/${filename}.${images_ext}`;
          var resThumb = `${domain_name}:${server_port}/${thumb_name}.${images_ext}`
          var result = inlineQueryResultPhotoFactory(queryId, resUrl, resThumb, dimensions);
          log.info('Generated url');
          bot.answerInlineQuery(queryId, [result]);
        } else 
          log.error('Error during thumb creation.');
          console.log(err);
      });
    });
  });
}