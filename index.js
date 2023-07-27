const express = require('express')
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios')
require('dotenv').config()
const PORT = 4000

const app = express();


// Create a new bot instance
const {TOKEN, SERVER_URL} = process.env
const URI = `/webhook/${TOKEN}`
const webhookURL = `${SERVER_URL}${URI}`

// configuring the bot via Telegram API to use our route below as webhook
const setupWebhook = async () => {
  try {
      const { data } = await axios.get(`${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`)
      console.log(data)
  } catch (error) {
      return error
  }
}

const bot = new TelegramBot(TOKEN, { polling: true });

// app.get('/',(req, res)=> {
//   res.send('working')
// })

app.post(URI, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const commands = [
  // [{text: 'Balance', callback_data: 'balance'},{text: 'Add Fund', callback_data: 'add_fund'}],
  { text: 'Bank Log', callback_data: 'bank_log' },
  { text: 'DL and SSN', callback_data: 'dl' },
  { text: 'Facebook', callback_data: 'facebook' },
  { text: 'Greendot', callback_data: 'greendot' }
];
const keyboard = {
  inline_keyboard: commands.map((command) => [{ text: command.text, callback_data: command.callback_data }])
 
};


// we're using the API's in-built "onText" method
// it takes in a regex and the message
bot.onText(/\/start/, (msg) => {

  const chatId = msg.chat.id

  // listens for "/start" and responds with the greeting below.
  bot.sendMessage(chatId, 'Please select a command:', { reply_markup: keyboard });

});

bot.on('callback_query', (callbackQuery)=> {
  const message = callbackQuery.message;
  const category = callbackQuery.data

  console.log(category)
  console.log(message)

  if(category !== 'undefined') bot.sendMessage(message.chat.id, `You sent a request of ${category}`)
})



app.listen( process.env.PORT || PORT, async () => {
  console.log(`Express server listening on port ${PORT}`);
  await setupWebhook()
});







