const bookshelf = require('../lib/bookshelf');

const Session = bookshelf.Model.extend({
  tableName: 'sessions'
});

module.exports = Session;
