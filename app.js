const express = require('express');
const path = require('path');
const fs = require('fs');
const hbs = require('express-handlebars');

const app = express();
const PORT = 3000;

const POSTS_DIR = path.join(__dirname, 'posts');

// Set up Handlebars
app.engine('handlebars', hbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home page: List posts
app.get('/', (req, res) => {
  fs.readdir(POSTS_DIR, (err, files) => {
    if (err) return res.status(500).send('Error reading posts');

    const posts = files
      .filter(file => file.endsWith('.txt'))
      .map(filename => {
        const filepath = path.join(POSTS_DIR, filename);
        const content = fs.readFileSync(filepath, 'utf8');
        return {
          slug: path.basename(filename, '.txt'),
          preview: content.split(' ').slice(0, 10).join(' ') + '...',
        };
      });

    res.render('home', { posts });
  });
});

// Individual post page
app.get('/post/:slug', (req, res) => {
  const slug = req.params.slug;
  const filepath = path.join(POSTS_DIR, slug + '.txt');

  fs.readFile(filepath, 'utf8', (err, content) => {
    if (err) return res.status(404).send('Post not found');
    res.render('post', { title: slug, content });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
