// import bot framework
var TelegramBot = require('node-telegram-bot-api');

// import libs for work with system
var fs          = require('fs'); // file-system
var path        = require('path'); // for generating pathnames
var log         = require('./libs/log')(module);
var config      = require('./libs/config');

const token = config.get('token');

var bot = new TelegramBot(token, { polling: true });

const tex_dir = config.get('tex-dir');
const images_dir = config.get('images-dir');
const images_ext = config.get('images-ext');
const images_res = config.get('resolution');

const messages = config.get('bot-messages');

const spawn = require('child_process').spawn; // for running bash scripts

bot.onText(/\/tex (.+)/, function (msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  // name of res file without extension
  var filename  = msg.message_id;
  var path2preprocess = path.join(tex_dir, filename + '.tex');
  var data = match[1];
  // create file with message as content
  fs.writeFile(path2preprocess, data, function (err) {
      if (err) return console.log(err);

      var chatId = msg.chat.id;
      var path2res = path.join(images_dir, filename + '.' + images_ext);
      const tex2im = spawn('tex2im', ['-r', images_res,
                                      '-o', path2res, path2preprocess]);
      tex2im.stdout.on('data', (data) => {
        log.error(`stdout: ${data}`);
      });

      tex2im.stderr.on('data', (data) => {
        log.error(`stderr: ${data}`);
      });

      tex2im.on('close', (code) => {
        log.info(`child process exited with code ${code}`);
        fs.exists(path2res, function (exists) {
              if (exists)
                bot.sendPhoto(chatId, path2res, {
                  caption: messages['send-photo']
                });
        });
      });
  });
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', function (msg) {
  // Do something
});
