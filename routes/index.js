const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    console.log('rout hit')
    res.send('trashting')
})