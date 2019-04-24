module.exports = {
  test: {
    client: 'sqlite3',
    connection: {
      filename: './rollrace.db'
    },
    useNullAsDefault: true,
    seeds: {
      directory: './seeds/test'
    }
  },

  development: {
    client: 'sqlite3',
    connection: {
      filename: './rollrace.db'
    },
    seeds: {
      directory: './seeds/dev'
    },
    useNullAsDefault: true
  },

  production: {
    client: 'pg',
    connection: {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
      host: process.env.DB_HOST,
      ssl: true
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};
