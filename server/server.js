const express = require('express');
const bodyParser = require('body-parser');
const { createUser, getUser } = require('./queries');

const app = express();

// express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  // Resolve client build directory as absolute path to avoid errors in express
  const path = require('path'); // eslint-disable-line global-require
  const buildPath = path.resolve(__dirname, '../client/build');

  app.use(express.static(buildPath));

  // Serve the HTML file included in the CRA client on the root path
  app.get('/', (request, response) => {
    response.sendFile(path.join(buildPath, 'index.html'));
  });
}

// middleware for parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make new user
app.post('/api/users', createUser);

// Fetch specific user
app.get('/api/users/:id', getUser);

module.exports = {
  app
};
