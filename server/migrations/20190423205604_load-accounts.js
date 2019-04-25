/* eslint-disable func-names */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
exports.up = function(knex, Promise) {
  return knex.schema.createTable('Accounts', table => {
    table.increments('id');
    table
      .string('username')
      .notNullable()
      .unique();
    table.string('password').notNullable();
    table.integer('total_games').notNullable();
    table.integer('total_multi_games').notNullable();
    table.integer('total_multi_wins').notNullable();
    table.integer('map_1');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('Accounts');
};
