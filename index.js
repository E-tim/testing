
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bodyParser = require('body-parser');
const WebSocket  = require('ws')

require('dotenv').config();
const PORT = 4000;

const app = express();

app.use(bodyParser.json());

// Create a new bot instance
const { TOKEN, SERVER_URL } = process.env;
const URI = `/webhook/${TOKEN}`;
const webhookURL = `${SERVER_URL || 'https://testing-one-coral.vercel.app/'}${URI}`;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello! I am your bot. Type /hello to greet me.');
});

// Respond to '/hello' command
bot.onText(/\/hello/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello there! How can I assist you today?');
});



app.get('/', (req, res) => {
  res.send('Telegram Bot is running!');
});


const webhookURLs = `https://qwewew-6b05de536ab3.herokuapp.com/${TOKEN}`;
bot.setWebHook(webhookURLs);



// ... Rest of your code for handling commands and callback queries ...

app.listen(process.env.PORT || PORT, async () => {
  console.log(`Express server listening on port ${PORT}`);
  // await setupWebhook();
});


