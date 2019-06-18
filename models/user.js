const bookshelf = require('../lib/bookshelf');

module.exports = bookshelf.model('User', {
  tableName: 'users'
});
