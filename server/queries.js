// const { pool } = require('./db-config');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  ssl: true,
  max: 20,
  idleTimeoutMillis: 30000
});

const createUser = (request, response) => {
  const { username, password } = request.body;

  // https://node-postgres.com/api/pool
  (async function() {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO account (username, password, total_multi_wins, total_multi_games, total_games) VALUES ($1, $2, 0, 0, 0)',
      [username, password],

      // NEED TO FIGURE OUT HOW TO MAKE NOT CRASH IF NOT VALID
      error => {
        if (error) {
          throw error;
        }
        response.status(201).send('User added');
      }
    );
    client.release();
  })();
};

const getUser = (request, response) => {
  const username = request.params.id.substring(1);

  (async function() {
    const client = await pool.connect();
    await client.query(
      'SELECT * FROM account WHERE username = $1',
      [username],
      (error, result) => {
        if (error) {
          throw error;
        }
        response.status(200).send(result);
      }
    );
    client.release();
  })();
};

module.exports = { createUser, getUser };
