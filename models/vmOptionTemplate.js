const bookshelf = require('../lib/bookshelf');
require('./vmConfig');

const VmOptionTemplate = bookshelf.model('VmOptionTemplate', {
  tableName: 'vm_option_templates',

  vmConfigs() {
    return this.hasMany('VmConfig');
  },


  async delete() {
    const count = await this.vmConfigs().count();
    if (count > 0) {
      throw new Error("Cannot delete this kvm arg which is used by machine.");
    } else {
      return await this.destroy();
    }
  }
});

module.exports = VmOptionTemplate;
