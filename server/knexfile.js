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
    useNullAsDefault: true
  },

  production: {
    client: 'postgresql',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    pool: {
      min: 2,
      max: 10
    },
    ssl: true
  }
};

//   production: {
//     client: 'postgresql',
//     connection: {
//       database: 'my_db',
//       user:     'username',
//       password: 'password'
//     },
//     pool: {
//       min: 2,
//       max: 10
//     },
//     migrations: {
//       tableName: 'knex_migrations'
//     }
//   }
//
// };
