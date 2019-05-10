/* eslint-disable func-names */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
exports.up = function(knex, Promise) {
  return knex.schema.table('Users', table => {
    table
      .integer('map_2')
      .notNullable()
      .defaultTo(-1);
    table
      .integer('map_3')
      .notNullable()
      .defaultTo(-1);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('Users', table => {
    table.dropColumn('map_2');
    table.dropColumn('map_3');
  });
};
