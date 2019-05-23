const bookshelf = require('../lib/bookshelf');

const Vm = bookshelf.Model.extend({
  tableName: 'vms'
});

module.exports = Vm;
