const bookshelf = require('../lib/bookshelf');
require('./vmOptionTemplate');
require('./osTemplate');

const OS = bookshelf.model('OS', {
  tableName: 'oss',

  vmOptionTemplates() {
    return this.belongsToMany('VmOptionTemplate', 'oss_vm_option_templates', 'os_id', 'vm_option_template_id');
  },


  async delete() {
  }
});

module.exports = OS;
