
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bodyParser = require('body-parser');
const WebSocket  = require('ws')
const { v4: uuidv4 } = require('uuid')
const uniqueId = uuidv4()
const botConFig = require('./botConfig')

const payment = require('./payment')

const fs = require('fs')
const path = require('path')
const filepath = 'ssnFulls.txt' 

// Initialize an empty array to store the lines from the file
const linesArray = [];
// Read the file line by line and store each line in the array
const readStream = fs.createReadStream(filepath, 'utf8');
const lineReader = require('readline').createInterface({
  input: readStream,
});

lineReader.on('line', (line) => {
  linesArray.push(line);
});
lineReader.on('close', () => {
  // At this point, 'linesArray' contains all the lines from the file
  console.log(linesArray);

  // Now, you can process the array to create objects or perform other tasks.
});


const filePath2 = 'fullz.txt';
const linesPerObject = 8; // Number of lines to group into each object

fs.readFile(filePath2, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  const lines = data.split('\n'); // Split the file content into an array of lines

  const objectsArray = [];
  for (let i = 0; i < lines.length; i += linesPerObject) {
    const obj = {};
    for (let j = 0; j < linesPerObject; j++) {
      const lineNumber = i + j;
      if (lineNumber < lines.length) {
        // Use the line number as a key and the line content as a value in the object
        obj[`line${j + 1}`] = lines[lineNumber];
      }
    }
    objectsArray.push(obj);
  }

  console.log(objectsArray);
});




require('dotenv').config();
const PORT = 4000;

const app = express();

app.use(bodyParser.json());




// Create a new bot instance
const { TOKEN, SERVER_URL, API_KEY } = process.env;
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
  bot.sendMessage(msg.chat.id, 
                  `<b>Welcome to Xstore ! \n</b><i>To use any of our service, You must have atleast $35 in your account. Use ADD FUND command to pay</i>`,
                     {parse_mode: 'HTML',reply_markup: keyboard});
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
        [{ text: '/start', callback_data: '/start' },{ text: 'Button 3' }],
      ],
    };

    bot.sendMessage(chatId, 'You have $0.0, add fund', {reply_markup: keyboard })
  }

  // fullz
  if (data === 'fullz') {

    // defining command prompt
    const commands = [
      // [{text: 'Balance', callback_data: 'balance'},{text: 'Add Fund', callback_data: 'add_fund'}],
      { text: 'Credit Card', callback_data: 'cc' },
      { text: 'SSN', callback_data: 'ssn' },
      { text: 'Bank Log', callback_data: 'banklog' },
    ];
    const fullsKeyboard = {
      inline_keyboard: commands.map((command) => [{ text: command.text, callback_data: command.callback_data }])
     
    };
    
    bot.sendMessage(chatId, `You can now purchase, ${username}.`, {reply_markup: fullsKeyboard})

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
async function createCharge() {
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
      if(data === 'bitcoin') {
        const inlineKeyboard = {
          inline_keyboard: [
            [{ text: 'Completed', callback_data: chargeData.id }],
          ],
        };
        bot.sendMessage(chatId,
           ` <b>Use the below address for the payment and click complete when you have sent\n</b> <b>Bitcoin : </b>  <i>${chargeData.addresses.bitcoin}</i>`, 
           {parse_mode: 'HTML', reply_markup: JSON.stringify(inlineKeyboard) })
      }
      if(data === 'litecoin') {
        const inlineKeyboard = {
          inline_keyboard: [
            [{ text: 'Completed', callback_data: chargeData.id }],
          ],
        };
        bot.sendMessage(chatId,
           ` <b>Use the below address for the payment and click complete when you have sent\n</b> <b>Litecoin : </b>  <i>${chargeData.addresses.litecoin}</i>`, 
           {parse_mode: 'HTML', reply_markup: JSON.stringify(inlineKeyboard) })
      }
      if(data === 'etherium') {
        const inlineKeyboard = {
          inline_keyboard: [
            [{ text: 'Completed', callback_data: chargeData.id }],
          ],
        };
        bot.sendMessage(chatId,
           ` <b>Use the below address for the payment and click complete when you have sent\n</b> <b>Etherium : </b>  <i>${chargeData.addresses.etherium}</i>`, 
           {parse_mode: 'HTML', reply_markup: JSON.stringify(inlineKeyboard) })
      }
      if(data === 'doge') {
        const inlineKeyboard = {
          inline_keyboard: [
            [{ text: 'Completed', callback_data: chargeData.id }],
          ],
        };
        bot.sendMessage(chatId,
           ` <b>Use the below address for the payment and click complete when you have sent\n</b> <b>Doge : </b>  <i>${chargeData.addresses.dogecoin}</i>`, 
           {parse_mode: 'HTML', reply_markup: JSON.stringify(inlineKeyboard) })
      }
      if(data === 'tether') {
        const inlineKeyboard = {
          inline_keyboard: [
            [{ text: 'Completed', callback_data: chargeData.id }],
          ],
        };
        bot.sendMessage(chatId,
           ` <b>Use the below address for the payment and click complete when you have sent\n</b> <b>Tether : </b>  <i>${chargeData.addresses.tether}</i>`, 
           {parse_mode: 'HTML', reply_markup: JSON.stringify(inlineKeyboard) })
      }
    })

  } catch (error) {
    console.error('Error:', error);
    // response.status(500).json({ error: 'An error occurred while creating the charge.' });
  }
}

createCharge();





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
      const status = response.data[0].status;
      console.log(status)
      console.log(data)
    } catch (error) {
      console.log(error)
      console.log(data)
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


