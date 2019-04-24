/* eslint-disable camelcase */
const { Model } = require('objection');

class Accounts extends Model {
  static get tableName() {
    return 'Accounts';
  }

  // For more: https://json-schema.org/understanding-json-schema/reference/numeric.html#integer
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'password'],

      properties: {
        id: { type: 'integer' },
        username: { type: 'string', pattern: '[^s]' },
        password: { type: 'string', pattern: '[^s]' },
        total_games: { type: 'integer', default: '0' },
        total_multi_games: { type: 'integer', default: '0' },
        map_1_time: { type: 'integer', default: '0' }
      }
    };
  }
}

module.exports = Accounts;
