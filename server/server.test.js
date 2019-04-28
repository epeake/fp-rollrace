/* eslint-disable arrow-body-style */
const request = require('supertest');
const { app, knex } = require('./server');

const user = {
  id: 1,
  googleId: '111216980333337153369',
  givenName: 'Jack',
  email: 'jboi@google.edu',
  total_games: 10,
  total_multi_games: 9,
  total_multi_wins: 9,
  map_1: 120
};

test('Server "smoke" test', () => {
  expect(app).toBeDefined();
});

describe('Rollrace API', () => {
  beforeEach(() => {
    // fake authentication
    app.request.isAuthenticated = () => true;
    app.request.user = user;

    return knex.migrate
      .rollback()
      .then(() => knex.migrate.latest())
      .then(() => knex.seed.run());
  });

  afterEach(() => {
    return knex.migrate.rollback();
  });

  // SuperTest has several helpful methods for conveniently testing responses
  // that we can use to make the tests more concise

  describe('GET operations', () => {
    test('GET /api/users/stats should return all user stats', () => {
      return request(app)
        .get('/api/users/stats')
        .expect(200)
        .expect(user);
    });

    test('GET should fail when unauthorized', () => {
      app.request.isAuthenticated = () => false;
      return request(app)
        .get('/api/users/stats')
        .expect(403);
    });
  });

  describe('PUT operations', () => {
    afterEach(() => {
      app.request.user = user;
    });

    test('PUT should update user if score is better than current', () => {
      const updatedUser = {
        type: 'end',
        contents: {
          time: 3
        }
      };

      request(app)
        .put('/api/users/')
        .send(updatedUser);

      return expect(app.request.user).toEqual(Object.assign(user, { time: 3 }));
    });

    test('PUT should update user if score === -1 (if they have not yet played)', () => {
      app.request.user = Object.assign(user, { time: -1 });
      const updatedUser = {
        type: 'end',
        contents: {
          time: 3
        }
      };

      request(app)
        .put('/api/users/')
        .send(updatedUser);

      return expect(app.request.user).toEqual(Object.assign(user, { time: 3 }));
    });

    test('PUT should not update user if score is worse than current', () => {
      const updatedUser = {
        type: 'end',
        contents: {
          time: 20
        }
      };
      request(app)
        .put('/api/users/')
        .send(updatedUser);

      return expect(app.request.user).toEqual(Object.assign(user));
    });

    test('PUT should fail when unauthorized', () => {
      app.request.isAuthenticated = () => false;

      const updatedUser = {
        type: 'end',
        contents: {
          time: 20
        }
      };
      return request(app)
        .put('/api/users/')
        .send(updatedUser)
        .expect(403);
    });
  });
});
