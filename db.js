const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    password: process.env.PG_PWDwd,
    host: 'localhost',
    database: 'blog',
    port: 5432

})

module.exports = {
    query: (text, params) => pool.query(text, params)
}