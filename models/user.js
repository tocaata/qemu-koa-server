const bookshelf = require('../lib/bookshelf');

const User = bookshelf.Model.extend({
  tableName: 'users'
});

module.exports = User;
