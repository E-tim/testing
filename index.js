
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bodyParser = require('body-parser');
const WebSocket  = require('ws')
const { v4: uuidv4 } = require('uuid')
const uniqueId = uuidv4()

require('dotenv').config();
const PORT = 4000;

const app = express();

app.use(bodyParser.json());

// api key
const API_KEY = '1526a2a9-3983-4f68-a12e-45b5927249af'




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
  { text: 'Check Balance', callback_data: 'balance' },
  { text: 'Add Fund', callback_data: 'add_fund' },
];
const keyboard = {
  inline_keyboard: commands.map((command) => [{ text: command.text, callback_data: command.callback_data }])
 
};


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome to Xstore !', {reply_markup: keyboard});
  console.log(msg)
});

bot.on('callback_query', async(query)=> {
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


  // checking for balance
  if (data === 'balance') {
    const keyboard = {
      keyboard: [
        [{ text: 'Add Fund', callback_data: 'fund' }, { text: '/start', callback_data: '/start' }],
        [{ text: 'Button 3' }],
      ],
      resize_keyboard: true,
    };

    bot.sendMessage(chatId, 'You have $0.0', {reply_markup: keyboard })
  }

  // fullz
  if (data === 'fullz') {

    // defining command prompt
    const keyboard = {
      keyboard: [
        [{ text: 'Add Fund', callback_data: 'fund' }, { text: '/start', callback_data: '/start' }],
        [{ text: 'Button 3' }],
      ],
      resize_keyboard: true,
    };

    // fetching from firebase firestore user
    const colleectionRef = db.collection('tel-users')
    colleectionRef.get()
    .then((snapshot)=> {
      const dataArray = [];

      snapshot.forEach((doc)=> {
        dataArray.push(doc.data(), doc.id);
        // checking if dataArray includes doc.id
        if (dataArray[1].includes(chatId)) {
          if(dataArray[0].bal >= 50) bot.sendMessage(chatId, `You can now purchase, ${username}.`)
          if(dataArray[0].bal < 50) bot.sendMessage(chatId, `You balance is insufficient to do purchase, ${username}.`, {reply_markup: keyboard })
        } else {
          bot.sendMessage(chatId, `You must be a subscriber to use this services, add fund now ${username}.`, {reply_markup: keyboard })
        }
      })
      console.log(dataArray)
      console.log(chatId)
      console.log(dataArray[0].bal)
      
    })

  }

  if (data === 'add_fund') {
    // definig querry for different coin
    const commands = [
      { text: 'BTC', callback_data: 'bitcoin' }, 
      { text: 'Litecoin', callback_data: 'litecoin' },
      { text: 'ETH', callback_data: 'etherium' }, 
      { text: 'Doge', callback_data: 'doge' },
      { text: 'Tether', callback_data: 'tether' },
    ];
    const keyboard = {
      inline_keyboard: commands.map((command) => [{ text: command.text, callback_data: command.callback_data }])
    };
    bot.sendMessage(chatId, 'Select the type of cryptocurrency', {reply_markup: keyboard })
  }

})


// payment using coinbase
app.get('/createCharge', async(req, res)=> {
  try {
    const response = await axios.post(
      'https://api.commerce.coinbase.com/charges',
      {
        name: 'Sample Payment',
        description: 'Payment for a product or service',
        pricing_type: 'fixed_price',
        local_price: {
          amount: '10.00',
          currency: 'USD',
        },
        metadata: {
          customer_id: uniqueId,
        },
      },
      {
        headers: {
          'X-CC-Api-Key': API_KEY,
          'X-CC-Version': '2018-03-22',
        },
      }
    );

    const chargeData = response.data.data;
    console.log('Charge Data:', chargeData);

    // checking the type of crypto selected
    bot.on('callback_query', async(query)=> {
      const chatId = query.message.chat.id;
      const data = query.data
      const username = query.message.chat.username

      // html template to send to tel-user
      if(data === 'bitcoin') bot.sendMessage(chatId, ` <b>Use the below address for the payment and click complete when you have sent \n</b>  <i>${chargeData.addresses.bitcoin}</i>`, { parse_mode: 'HTML' })
      if(data === 'litecoin') bot.sendMessage(chatId, ` <b>Use the below address for the payment and click complete when you have sent \n</b>  <i>${chargeData.addresses.litecoin}</i>`, { parse_mode: 'HTML' }, {reply_markup: [{ text: 'Completed', callback_data: chargeData.id }] })
      if(data === 'etherium') bot.sendMessage(chatId, ` <b>Use the below address for the payment and click complete when you have sent \n</b>  <i>${chargeData.addresses.ethereum}</i>`, { parse_mode: 'HTML' }, {reply_markup: [{ text: 'Completed', callback_data: chargeData.id }] })
      if(data === 'doge') bot.sendMessage(chatId, ` <b>Use the below address for the payment and click complete when you have sent \n</b>  <i>${chargeData.addresses.dogecoin}</i>`, { parse_mode: 'HTML' }, {reply_markup: [{ text: 'Completed', callback_data: chargeData.id }] })
      if(data === 'tether') bot.sendMessage(chatId, ` <b>Use the below address for the payment and click complete when you have sent \n</b>  <i>${chargeData.addresses.tether}</i>`, { parse_mode: 'HTML' }, {reply_markup: [{ text: 'Completed', callback_data: chargeData.id }] })
    })

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while creating the charge.' });
  }
  
})


// checking payment status
bot.on('callback_query', async(query)=> {
  const chatId = query.message.chat.id;
  const data = query.data
  const username = query.message.chat.username

  const chargeId = data
    try {
      const response = await axios.get(`https://api.commerce.coinbase.com/charges/${chargeId}`,
        {
          headers: {
            'X-CC-Api-Key': API_KEY,
            'X-CC-Version': '2018-03-22',
          }
        }
      )
      const status = response.data.data[0].status;
      console.log(status)
    } catch (error) {
      
    }
})









bot.onText(/\/free/, (msg)=>{
  const docRef = db.collection('tel-users').doc(msg.chat.id)
  const datas = {
    isPremium: true,
    bal: 50
  }
  try {
    const resultRecieved = docRef.set(datas)
    bot.sendMessage(msg.chat.id, `You've been given $50. Start buying .`)
    console.log(resultRecieved)
  } catch (error) {
    console.log(error)
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


