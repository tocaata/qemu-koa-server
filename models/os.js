const bookshelf = require('../lib/bookshelf');
require('./vmOptionTemplate');
require('./osTemplate');
require('./vm');

const OS = bookshelf.model('OS', {
  tableName: 'oss',

  vmOptionTemplates() {
    return this.belongsToMany('VmOptionTemplate', 'oss_vm_option_templates', 'os_id', 'vm_option_template_id');
  },

  vms() {
    return this.hasMany('Vm');
  },

  update(attributes, templates) {
    return bookshelf.transaction(async t => {
      await this.set(attributes).save(null, { transacting: t });
      const cur = await this.vmOptionTemplates().fetch();
      let ids = cur.map(t => t.id);

      let deleted = ids.filter(x => !templates.includes(x));
      let added = templates.filter(x => !ids.includes(x));

      await this.vmOptionTemplates().detach(deleted, { transacting: t });
      await this.vmOptionTemplates().attach(added, { transacting: t });
    });
  },

  async delete() {
    return bookshelf.transaction(async t => {
      await this.vmOptionTemplates().detach(null, { transacting: t });
      await this.destroy({ transacting: t });
    });
  }
});

module.exports = OS;
