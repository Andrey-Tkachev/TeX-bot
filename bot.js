var TelegramBot = require('node-telegram-bot-api');
var fs          = require('fs');
var path        = require('path');


var token = '321732536:AAFOOSuPAA5eB6yKk9uvNByUpwFIuhJHvlQ';

var bot = new TelegramBot(token, { polling: true });

const images_dir = 'images'
const spawn = require('child_process').spawn;

bot.onText(/\/tex (.+)/, function (msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  var filename  = 'test';
  var extension = '.png'

  var data = match[1];
  fs.writeFile(filename, data, function (err) {
      if (err) return console.log(err);

      var chatId = msg.chat.id;
      var path2res = path.join(images_dir, filename + extension);
      const tex2im = spawn('tex2im', ['-r', '300x300',
                                      '-o', path2res, filename]);
      tex2im.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      tex2im.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      });

      tex2im.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        fs.exists(path2res, function (exists) {
              if (exists)
                bot.sendPhoto(chatId, path2res, {caption: "It's your TeX!"});
        });
      });
  });
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  // send a message to the chat acknowledging receipt of their message
});
