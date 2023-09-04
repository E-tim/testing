
const express = require('express');
const botConFig = require('./botConfig')
const axios = require('axios');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid')
const uniqueId = uuidv4()

require('dotenv').config();


const app = express();

app.use(bodyParser.json());

// Create a new bot instance
const bot = botConFig.bot



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

module.exports = createCharge;



