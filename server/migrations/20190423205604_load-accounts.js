/* eslint-disable func-names */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
exports.up = function(knex, Promise) {
  return knex.schema.createTable('Users', table => {
    table.increments('id');
    table.string('googleId').notNullable();
    table.string('givenName').notNullable();
    table.text('email').notNullable();
    table.integer('total_games').notNullable();
    table.integer('total_multi_games').notNullable();
    table.integer('total_multi_wins').notNullable();
    table.integer('map_1').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('Users');
};
