const bookshelf = require('../lib/bookshelf');
require('./vm');
require('./vmOptionTemplate');

module.exports = bookshelf.model('VmConfig', {
  tableName: 'vm_configs',
  vm() {
    return this.belongsTo('Vm');
  },

  vmOptionTemplate() {
    return this.belongsTo('VmOptionTemplate');
  }
});
