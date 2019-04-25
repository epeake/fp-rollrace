const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
const { Model, ValidationError } = require('objection'); // ValidationError
const Users = require('./models/Users');
const session = require('express-session');
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
app.use(passport.initialize());

// const authenticationMiddleware = (request, response, next) => {
//   if (request.isAuthenticated()){
//     return next(); // we are good, proceed to the next handler
//   }
//   return response.sendStatus(403); // forbidden
// };

passport.use(
  new BearerStrategy((token, done) => {
    googleClient
      .verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      })
      .then(async ticket => {
        const payload = ticket.getPayload();
        let currUser = await Users.query().findOne('googleId', payload.sub);
        if (!currUser) {
          Users.query()
            .insertAndFetch({
              googleId: payload.sub,
              givenName: payload.given_name,
              email: payload.email,
              total_games: 0,
              total_multi_games: 0,
              total_multi_wins: 0,
              map_1: -1
            })
            .then(rows => done(null, rows));
        } else {
          done(null, currUser);
        }
      })
      .catch(error => {
        done(error);
      });
  })
);

// Google login
app.post(
  '/login',
  passport.authenticate('bearer', { session: false }),
  (request, response, next) => {
    response.sendStatus(200);
  }
);

// authenticationMiddleware,
app.put(
  '/api/users/',

  (request, response, next) => {
    console.log(request.isAuthenticated(), request.user);
    // const { id } = request.body.contents.id;
    // const { time } = request.body.contents.time;
    // const { type } = request.body.type;
    //
    // // make sure correct user
    // if (id !== parseInt(request.params.id.substring(1), 10)) {
    //   throw new ValidationError({
    //     statusCode: 400,
    //     message: 'URL id and request id do not match'
    //   });
    // }
    // if (type === 'end') {
    //   (async () => {
    //     const user = await Users.query().findById(id);
    //     if (user.map_1 === -1 || user.map_1 > time) {
    //       // REPLACE WITH GENERICCC
    //       user
    //         .$query()
    //         .patchAndFetch({ map_1: time, total_games: user.total_games + 1 })
    //         .then(rows => {
    //           response.send(rows);
    //         }, next);
    //     }
    //   })();
    // }
  }
);

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
