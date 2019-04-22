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
      'INSERT INTO account (username, password) VALUES ($1, $2)',
      [username, password],
      (error, result) => {
        if (error) {
          throw error;
        }
        response.status(201).send(`User added with ID: ${result.insertId}`);
      }
    );
    client.release();
  })();
};

module.exports = { createUser };
