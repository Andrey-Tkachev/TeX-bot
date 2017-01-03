// import bot framework
var TelegramBot = require('node-telegram-bot-api');

// import libs for work with system
var fs          = require('fs'); // file-system
var path        = require('path'); // for generating pathnames
var log         = require('./libs/log')(module);
var config      = require('./libs/config');
var static      = require('node-static');

const token = config.get('token');

var bot = new TelegramBot(token, { polling: true });

const tex_dir = config.get('tex-dir');
const images_dir = config.get('images-dir');
const images_ext = config.get('images-ext');
const images_res = config.get('resolution');
const server_ip = config.get('ip');
const server_port = config.get('static-port');
const messages = config.get('bot-messages');

const tex2im_ex = config.get('tex2im');
// Server to images for inline mode
var static_files = new static.Server(`./${images_dir}`);
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        static_files.serve(request, response);
    }).resume();
}).listen(server_port);

var spawn = require('child_process').spawn; // for running bash scripts

function inlineQueryResultPhotoFactory(id, photo_url) {
  return {
    type: 'photo',
    id: id,
    photo_url: photo_url,
    thumb_url: photo_url
  }
}

function tex2png(data, filename, callback) {
  var path2preprocess = path.join(tex_dir, filename + '.tex');
  fs.writeFile(path2preprocess, data, function (err) {
      if (err) return console.log(err);
      var path2res = path.join(images_dir, filename + '.' + images_ext);
      var tex2im = spawn(tex2im_ex, ['-r', images_res,
                                      '-o', path2res,
                                      '-z', path2preprocess], {stdio:'inherit'});

      tex2im.on('error', function(err){
        log.error('parentError:', err);
      });

      tex2im.on('close', (code) => {
        log.info(`child process exited with code ${code}`);
        fs.exists(path2res, function (exists) {
              if (exists) {
                callback(path2res);
              }
        });
      });
  });
}


bot.onText(/\/tex (.+)/, function (msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  // name of res file without extension
  log.info('simple query');
  var filename  = msg.message_id;
  var data = match[1];
  var chatId = msg.chat.id;
  // create file with message as content
  tex2png(data, filename, function (path2res) {
    bot.sendPhoto(chatId, path2res, {
        caption: messages['send-photo']
    });
  });
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', function (msg) {
  // Do something
});

bot.on('inline_query', function(query) {
  log.info('inline query');
  var queryId = query.id;
  var filename = query.id + '_inline';
  var data = query.query;
  tex2png(data, filename, function (path2res) {
    var resUrl = `${server_ip}:${server_port}/${filename}.${images_ext}`;
    var result = inlineQueryResultPhotoFactory('1', resUrl); // 1 becouse we have only one result
    bot.answerInlineQuery(queryId, [result]);
  });

});
