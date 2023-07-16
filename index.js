const express = require('express')
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()
const PORT = 4000

const token = process.env.TOKEN







// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

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







