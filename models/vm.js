const bookshelf = require('../lib/bookshelf');

const Vm = bookshelf.Model.extend({
  tableName: 'vms',
  configs() {
    return this.hasMany(VmConfig);
  }
});

const VmConfig = bookshelf.Model.extend({
  tableName: 'vm_configs',
  vm() {
    return this.belongsTo(Vm);
  }
});

module.exports = { Vm, VmConfig };
