
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bodyParser = require('body-parser');
const WebSocket  = require('ws')
const { v4: uuidv4 } = require('uuid')
const uniqueId = uuidv4()
const botConFig = require('./botConfig')
const session = require('express-session')

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

// Configure express-session middleware
app.use(
  session({
    secret: uniqueId,
    resave: false,
    saveUninitialized: true
  })
)

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
  { text: 'Terms and Conditions', callback_data: 'terms_condition' },
];
const keyboard = {
  inline_keyboard: commands.map((command) => [{ text: command.text, callback_data: command.callback_data }])
 
};


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 
                  `<b>Welcome to Chocolate Bot ! \n</b><i>To use any of our service, You must have atleast $35 in your account. Use ADD FUND command to pay.\n</i> <i>Please read our terms and conditions</i>`,
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
      { text: ' UK Credit Card', callback_data: 'cc' },
      { text: 'SSN', callback_data: 'ssn' },
      { text: 'Bank Log', callback_data: 'banklog' },
    ];
    const fullsKeyboard = {
      inline_keyboard: commands.map((command) => [{ text: command.text, callback_data: command.callback_data }])
     
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
          if(dataArray[0].bal >= 50) bot.sendMessage(chatId, `You can now purchase, ${username}.`, {reply_markup: fullsKeyboard})
          if(dataArray[0].bal < 50) bot.sendMessage(chatId, `You balance is insufficient to do purchase, ${username}.`, {reply_markup: keyboard })
        } else {
          // bot.sendMessage(chatId, `You must be a subscriber to use this services, add fund now ${username}. Add fund`, {reply_markup: keyboard })
          if(dataArray[0].bal >= 50) bot.sendMessage(chatId, `You can now purchase, ${username}.`, {reply_markup: fullsKeyboard})
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

  if (data === 'terms_condition') {
    const message = `
<b>Refund Policy \n</b>
<i>1. Check card on <a href="https://pay.google.com">Google Pay</a></i>
<i>2. If the card is dead, click refund at the bottom of purchased card.</i>
<i>3. Send the bot a Screenshot/Photo that proves the card is dead/Fake Expiry/False Information</i>
<i>4. When checking card on <a href="https://pay.google.com">Google Pay,</a> You have an automatic 3 minutes timer</i>
<i>5. Failing to check card / provide proof of card being dead past the 3 minute timer can result in no refund.</i>
<i>6. When providing a photo or a screenshot,please make sure: Card Number, Expiry Date and CCV are fully visible.</i>
<i>7. If number doesn't call or is invalid this doesn't qualify for refund /unless all missing or fake info.</i>

<b>Keep in Mind: ⤵</b>
<i>❌  HSBC CARDS ARE NOT REFUNDABLE Or ANY company under them such as John lewis,M&S, First direct ,etc) Due to abuse of checker Halifax and lloyds are Norefund</i>
<i>❌ THE FIRST HOUR OF BASE UNLOCK- BASE IS NOREFUND) (Better wait 1 hour before buying for refund enabled)</>
<i>❌ REFUNDS COULD BE REFUSED ANYTIME/OR VERY  HIGH REFUND RATE(ABUSE</>
<i>❌ SNIFFED BASES ARE NOREFUND DUE TO HIGH QUALITY</>
<i>⛔ IF A CARD HAS BEEN REJECTED ITS FINAL NO DISPUTE</>
<i>❌ SOME BINS MAY SHOW DECLINED ON GOOGLEPAY ,IF THE BASE IS FRESH DOUBLE CHECK ON ANOTHER CHECKER BEFORE SUBMITTING ELSE ACCOUNT WILL BE FLAGGED FOR ABUSE</>
<i>🔸Support account only for help dont spam or you will be ignored</>
<i>🔸1 Transaction per wallet unless payment is underpaid. Our wallet always changes after each completed deposit.</i>
<i>🔸 If u disagree with my rules and notes, u can go to another seller.</i>
<i>🔶 BY PURCHASING YOU AGREE TO THESE RULES. FAILURE TO READ THEM WILL FORFEIT YOUR REFUND / REPLACEMENT. WE SHALL GIVE NO WARNINGS</i>

    `
    bot.sendMessage(chatId, message, {parse_mode: 'HTML'})
    
  }

})


// payment using coinbase

app.get('/make-payment', async(req, res)=> {
  

})
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
      const status = response.data.data.status;
      console.log(status)
      console.log(data)
    } catch (error) {
      console.log(error)
      console.log(data)
    }
})


// Uk Fullz
bot.on('callback_query', async(query)=> {
  const chatId = query.message.chat.id;
  const data = query.data
  const username = query.message.chat.username
  if (data === 'cc') {
    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: 'Continue', callback_data: 'proceed' }],
      ],
    };
    bot.sendMessage(chatId,
       ` <b>You will be charged $45 for this service.\n</b> <i>Tap continue to proceed</i>`, 
       {parse_mode: 'HTML', reply_markup: JSON.stringify(inlineKeyboard) })

  }
})

//  checking if the user want to continue/proceed
bot.on('callback_query', async(quer)=> {
  const chatId = quer.message.chat.id;
  const data_result = quer.data

  if (data_result === 'proceed') {

    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: '/start', callback_data: '/start' }],
      ],
    };

    // Generate a random index within the range of valid indices
    const randomIndex = Math.floor(Math.random() * linesArray.length)

    // Use the random index to pick the element from the array
    const randomInfo = linesArray[randomIndex]
    console.log(randomInfo)
    bot.sendMessage(chatId,
      ` <b>${JSON.stringify(randomInfo)}</b>`, 
      {parse_mode: 'HTML', reply_markup: JSON.stringify(inlineKeyboard) })

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


// const webhookURLs = `https://qwewew-6b05de536ab3.herokuapp.com/${TOKEN}`;
// bot.setWebHook(webhookURLs);



// ... Rest of your code for handling commands and callback queries ...

app.listen(process.env.PORT || PORT, async () => {
  console.log(`Express server listening on port ${PORT}`);
  // await setupWebhook();
});


