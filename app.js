const express = require('express')
const hbs = require('express-handlebars')
const db = require('./db')
const path = require('path')

const app = express()
const PORT = 3000

app.engine('handlebars', hbs.engine())
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))

// list all posts
app.get('/', async (req, res) => {
    try{
        const db_result = await db.query('SELECT id, title, content FROM posts ORDER BY created_at DESC')
        const posts = db_result.rows.map(post => ({
            id: post.id,
            title: post.title,
            preview: post.content.split(' ').slice(0, 10).join(' ') + '...',
        }))
        res.render('home', { posts })
    } catch (err) {
        console.log(err)
        res.status(500).send('Error loading posts.')
    }
})

// single post
app.get('/post/:id', async (req, res) => {
    try {
        const db_result = await db.query(`SELECT * FROM posts WHERE id = ${req.params.id};`)
        const post = db_result.rows[0]
        if (!post) {
            return res.status(404).send('Post not found')
        }

        res.render('post', {
            id: post.id,
            title: post.title,
            content: post.content,
            date: post.created_at,
            logged_in: true
        })
    } catch (err) {
        res.status(500).send('Error loading post.')
    }
})

app.get('/edit/:id', async (req, res) => {
    try {
        const db_result = await db.query(`SELECT * FROM posts WHERE id = ${req.params.id};`)
        const post = db_result.rows[0]
        if (!post) {
            return res.status(404).send('Post not found.')
        }
        const logged_in = true
        if (logged_in == true) {
            res.render('edit', {
                title: post.title,
                content: post.content,
                date: post.created_at,
            })
        }
        else {
            return res.status(401).redirect(`/post/${post.id}`)
        }
        
    }catch (err) {
        console.log(err)
        res.status(500).send('Error loading post.')
    }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
