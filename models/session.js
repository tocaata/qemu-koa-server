const bookshelf = require('../lib/bookshelf');

const Session = bookshelf.Model.extend({
  tableName: 'Sessions'
});

module.exports = Session;
