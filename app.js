const express = require('express')
const hbs = require('express-handlebars')
const db = require('./db')
const path = require('path')
const bcrypt = require('bcrypt')
const session = require('express-session')

const requireLogin = require('./auth')

const app = express()
const PORT = 3000
const saltRounds = 10;
const sessionSecret = process.env.SESSION_SECRET
console.log(sessionSecret)

app.engine('handlebars', hbs.engine())
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie:{ secure: false } //change to true for https
}))

// list all posts page
app.get('/', async (req, res) => {
    try{
        const db_result = await db.query('SELECT id, title, content FROM posts ORDER BY created_at DESC')
        const posts = db_result.rows.map(post => ({
            id: post.id,
            title: post.title,
            preview: post.content.split(' ').slice(0, 10).join(' ') + '...',
        }))
        const logged_in = !!req.session.userId
        res.render('home', { posts, logged_in })
    } catch (err) {
        console.log(err)
        res.status(500).send('Error loading posts.')
    }
})

// display single post page
app.get('/post/:id', async (req, res) => {
    try {
        const db_result = await db.query(`SELECT * FROM posts WHERE id = '${req.params.id}';`)
        const post = db_result.rows[0]
        if (!post) {
            return res.status(404).send('Post not found')
        }
        const logged_in = !!req.session.userId
        content = post.content.replace(/\n/g, '<br>')
        res.render('post', {
            id: post.id,
            title: post.title,
            content: content,
            date: post.created_at,
            logged_in
        })
    } catch (err) {
        console.log(err)
        res.status(500).send('Error loading post.')
    }
})

// edit post page
app.get('/edit/:id', requireLogin, async (req, res) => {
    try {
        //Need to change this to auth middleware result
        let logged_in = true
        if (logged_in == true) {
            const db_result = await db.query(`SELECT * FROM posts WHERE id = '${req.params.id}';`)
            const post = db_result.rows[0]
            if (!post) {
                return res.status(404).send('Post not found.')
            }
            res.render('edit', {
                id: req.params.id,
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

// edit post action
app.post('/savepost/:id', async (req, res) => {
    const id = req.params.id
    const { title, content } = req.body
    try {
        db.query(`UPDATE posts SET title = $1, content = $2 WHERE id = $3;`,
            [title, content, id]
        )
    } catch (e) {
        console.error('db update error ', e)
        res.status(500).send('Server error updating database.')
    }
    res.redirect(`/post/${id}`)
})

//add post page
app.get('/add', requireLogin, (req, res) => {
    res.render('add')
})

//add post action
app.post('/addpost', async (req, res) => {
    const { title, content } = req.body
    try {
        db.query(`INSERT INTO posts (title, content) VALUES ($1, $2);`,
            [title, content]
        )
    } catch (e) {
        console.error('db add error ', e)
        res.status(500).send('Server error updating database.')
    }
    res.redirect('/')
})

//delete post action
app.get('/delete/:id', async (req, res) => {
    try {
        db.query(`DELETE FROM posts WHERE id = '${req.params.id}';`)
    } catch (e) {
        console.error('db delete error ', e)
        res.status(500).send('Server error updating database.')
    }
    res.redirect('/')
})

//login page
app.get('/login', (req, res) => {
    return res.render('login')
})

//login action
app.post('/login', async (req, res) => {
    let { email, password } = req.body
    try {
        db_result = await db.query(`SELECT * FROM users WHERE email = '${email}';`)
        if (!db_result.rows[0]) {
            throw new Error('Login Error: Email not found.')
        }
        email = db_result.rows[0].email
        hash = db_result.rows[0].password
        bcrypt.compare(password, hash, (err, response) => {
            console.log(response)
            req.session.userId = db_result.rows[0].id
            res.redirect('/')
        })
    } catch (e) {
        console.error('email match error ', e)
        res.status(401).send('Email does not match')
    }    
    
})

//signup page
app.get('/signup', (req, res) => {
    return res.render('signup')
})

//signup action
app.post('/signup', async (req, res) => {
    const { email, password } = req.body
    let encrypted_password = 'placeholder   '
    const pepper = process.env.PEPPER
    if (!pepper) {
        throw new Error('pepper env variable not found')
    }
    try {
        encrypted_password = await bcrypt.hash(password + pepper, saltRounds)
        console.log('should also be after hash',encrypted_password)
        result = await db.query(`INSERT INTO users (email, password) VALUES ($1, $2);`,
            [email, encrypted_password]
        )
        req.session.userId = result.rows[0].id
        res.redirect('/')
        return res.send('200')
    } catch (e) {
        console.error('db add error ', e)
        res.status(500).send('Server error updating database.')
    }
})

//logout action
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
