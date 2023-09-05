

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bodyParser = require('body-parser');
const WebSocket  = require('ws')
const { v4: uuidv4 } = require('uuid')
const uniqueId = uuidv4()
const botConFig = require('./botConfig')


const admin = require('firebase-admin')
const serviceAccount  = require('./serviceAccountKey.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
const db = admin.firestore();


// fetching from firebase firestore user
const colleectionRef = db.collection('tel-users')
colleectionRef.get()
.then((snapshot)=> {
  const dataArray = [];
  exports.dataArray

  snapshot.forEach((doc)=> {
    dataArray.push(doc.data(), doc.id);
    // checking if dataArray includes doc.id
  })
  console.log(dataArray)
  console.log(dataArray[0].bal)
  
})