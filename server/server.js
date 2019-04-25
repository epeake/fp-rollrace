const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
const { Model, ValidationError } = require('objection'); // ValidationError
const Accounts = require('./models/Accounts');

// Bind all Models to a knex instance.
Model.knex(knex);

// db-errors provides a consistent wrapper around database errors
const { wrapError, DBError } = require('db-errors');

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

// Cross-Origin-Resource-Sharing headers tell the browser is OK for this page to request resources
// from another domain (which is otherwise prohibited as a security mechanism)
const corsOptions = {
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  origin: '*',
  allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With', 'Origin']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make new user
app.post('/api/users', (request, response, next) => {
  Accounts.query()
    .insertAndFetch(request.body)
    .then(rows => {
      response.send(rows);
    }, next);
});

// TODOOOOOO GET RID OF 1 WITH MIDDLEWARE?
// Fetch specific user
app.get('/api/users/:username&:password', (request, response, next) => {
  const username = request.params.username.substring(1);
  const password = request.params.password.substring(1);
  Accounts.query()
    .where('username', username)
    .where('password', password)
    .then(rows => {
      response.send(rows);
    }, next);
});

app.put('/api/users/:id', (request, response, next) => {
  const id = request.body.contents.id;
  const time = request.body.contents.time;
  const type = request.body.type;

  // make sure correct user
  if (id !== parseInt(request.params.id.substring(1), 10)) {
    throw new ValidationError({
      statusCode: 400,
      message: 'URL id and request id do not match'
    });
  }
  if (type === 'end') {
    (async () => {
      const user = await Accounts.query().findById(id);
      if (user.map_1 == -1 || user.map_1 > time) {
        //// REPLACE WITH GENERICCC
        user
          .$query()
          .patchAndFetch({ map_1: time, total_games: user.total_games + 1 })
          .then(rows => {
            response.send(rows);
          }, next);
      }
    })();
  }
});

// Simple error handler.
app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
  }

  /*
   * Do not want to send information about the inner workings of the
   * database to the client.
   */
  if (process.env.NODE_ENV !== 'production') {
    const wrappedError = wrapError(error);
    if (wrappedError instanceof DBError) {
      response
        .status(400)
        .send(wrappedError.data || wrappedError.message || {});
    } else {
      response
        .status(wrappedError.statusCode || wrappedError.status || 500)
        .send(wrappedError.data || wrappedError.message || {});
    }
  }
});

module.exports = {
  app,
  knex
};
