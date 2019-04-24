/* eslint-disable func-names */
/* eslint no-unused-vars: ["error", { "args": "none" }] */
const fs = require('fs');

exports.seed = function(knex, Promise) {
  const contents = fs.readFileSync('seed.json');
  const data = JSON.parse(contents);

  // Deletes ALL existing entries
  // Use batch insert because we have too many articles for simple insert
  return knex('Accounts')
    .del()
    .then(() => knex.batchInsert('Accounts', data, 100));
};
