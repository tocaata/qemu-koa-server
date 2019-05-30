const bookshelf = require('../lib/bookshelf');
const vmOptionTemplate = require('./vmOptionTemplate');

const Vm = bookshelf.Model.extend({
  tableName: 'vms',
  configs() {
    return this.hasMany(VmConfig);
  },

  async getCmd() {
    const configs = await this.configs().fetch({withRelated: ['vmOptionTemplate']});

    return configs.map(c => {
      const conf = c.related('vmOptionTemplate'), kvs = JSON.parse(c.get('value'));
      let tpl = JSON.parse(conf.get('config')).template;

      for (let [k, v] of Object.entries(kvs)) {
        tpl = tpl.replace(k, v);
      }

      return [conf.get('arg'), tpl];
    })
  }
});

const VmConfig = bookshelf.Model.extend({
  tableName: 'vm_configs',
  vm() {
    return this.belongsTo(Vm);
  },

  vmOptionTemplate() {
    return this.belongsTo(vmOptionTemplate);
  }
});

module.exports = { Vm, VmConfig };
