const bookshelf = require('../lib/bookshelf');
const { VmConfig } = require('../models/vm');

const VmOptionTemplate = bookshelf.Model.extend({
  tableName: 'vm_option_templates',

  vmConfigs() {
    return this.hasMany(VmConfig);
  },


  async delete() {
    const count = this.vmConfigs().count();
    if (count > 0) {
      throw new Error("The option template has been used by virtual machine.");
    } else {
      return await this.destroy();
    }
  }
});

module.exports = VmOptionTemplate;
