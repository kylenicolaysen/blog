const express = require('express')
// const exphbs = require('express-handlebars')
const routes = require('routes')
// const path = require('path')

const port = process.env.PORT || 3000
const app = express()
app.use(express.static('public'))

// app.use('/', routes)
app.get('/', (req, res) => {
    res.send('TESTING 1 2')
})

app.listen(port, () => {
    console.log(`App running on http://localhost:${3000}`)
})