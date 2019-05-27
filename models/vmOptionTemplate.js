const bookshelf = require('../lib/bookshelf');

const Vm = bookshelf.Model.extend({
  tableName: 'vm_option_templates'
});

module.exports = Vm;
