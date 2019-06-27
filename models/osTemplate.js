const bookshelf = require('../lib/bookshelf');
require('./vmOptionTemplate');

const OSTemplate = bookshelf.model('OSTemplate', {
  tableName: 'oss_vm_option_templates',

  // vmOptionTemplates() {
  //   return this.hasMany('VmOptionTemplate');
  // },


  async delete() {
  }
});

module.exports = OSTemplate;
