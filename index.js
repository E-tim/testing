
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
const admin = require('firebase-admin')
const serviceAccount  = require('./serviceAccountKey.json')

const bot = new TelegramBot(TOKEN, { polling: true });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const commands = [
  // [{text: 'Balance', callback_data: 'balance'},{text: 'Add Fund', callback_data: 'add_fund'}],
  { text: 'Check CC', callback_data: 'checker' },
  { text: 'Buy Fullz', callback_data: 'fullz' },
];
const keyboard = {
  inline_keyboard: commands.map((command) => [{ text: command.text, callback_data: command.callback_data }])
 
};


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome to Xstore !', {reply_markup: keyboard});
  console.log(msg)
});

bot.on('callback_query', (query)=> {
  const chatId = query.message.chat.id;
  const data = query.data
  const username = query.message.chat.username

  if (data === 'checker') {
    const colleectionRef = db.collection('tel-users')
    colleectionRef.get()
    .then((snapshot)=> {
      const dataArray = [];

      snapshot.forEach((doc)=> {
        dataArray.push(doc.data(), doc.id);
        if (dataArray.includes(chatId)) {
          bot.sendMessage(chatId, `You are a subscriber, ${username}`)
        } else {
          bot.sendMessage(chatId, `You must be a subscriber to use this service, ${username}`)
        }
      })
      console.log(dataArray)
      
    })

    bot.sendMessage(chatId, `you selected ${data}`)
  }
})

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


