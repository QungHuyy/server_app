var express = require('express')
var router = express.Router()

const Chatbot = require('../Controller/chatbot.controller')

router.post('/chat', Chatbot.chat)

module.exports = router
