
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

app.get('/', (req, res)=> {
  res.send('working')
})

const bot = new TelegramBot(TOKEN, {polling: true})

// Create a WebSocket client to connect to the external WebSocket server
const wss = new WebSocket('ws://localhost:8080/');

// Handle WebSocket client events
wss.on('open', () => {
  console.log('WebSocket connection opened');
});

wss.on('message', (data) => {
  console.log('Received message from WebSocket server:', data);
});

wss.on('close', () => {
  console.log('WebSocket connection closed');
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

bot.on('message', async(msg)=> {
  console.log(msg)
  bot.sendMessage(msg.chat.id, "hello", {reply_markup: keyboard})

  // Send real-time updates to the WebSocket server when a new message is received
  wss.send(JSON.stringify({ type: 'message', data: msg }));
})






// ... Rest of your code for handling commands and callback queries ...

const server = app.listen(process.env.PORT || PORT, async () => {
  console.log(`Express server listening on port ${PORT}`);
  // await setupWebhook();
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
