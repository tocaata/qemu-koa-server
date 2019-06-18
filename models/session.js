const bookshelf = require('../lib/bookshelf');

module.exports = bookshelf.model('Session', {
  tableName: 'sessions'
});
