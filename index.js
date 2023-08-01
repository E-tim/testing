
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bodyParser = require('body-parser');

require('dotenv').config();
const PORT = 4000;

const app = express();

app.use(bodyParser.json());

// Create a new bot instance
const { TOKEN, SERVER_URL } = process.env;
const URI = `/webhook/${TOKEN}`;
const webhookURL = `${SERVER_URL || 'https://testing-one-coral.vercel.app/'}${URI}`;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// Configuring the bot via Telegram API to use our route below as a webhook
const setupWebhook = async () => {
  try {
    const { data } = await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url: webhookURL,
      drop_pending_updates: true,
    });
    console.log(data);
  } catch (error) {
    return error;
  }
};

// Creating a bot instance with polling disabled for better webhook handling
const bot = new TelegramBot(TOKEN, { polling: false });

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

app.post(URI, (req, res) => {
  const update = req.body;
  const chatId = req.body.message.chat.id
  console.log(chatId)
  if (update.message && update.message.text) {
    const text = update.message.text;
    if (text === '/start') {
      console.log(update);
      bot.sendMessage(chatId, 'Please select a command:', {reply_markup: JSON.stringify(keyboard)})
    }
  }
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ... Rest of your code for handling commands and callback queries ...

app.listen(process.env.PORT || PORT, async () => {
  console.log(`Express server listening on port ${PORT}`);
  await setupWebhook();
});
