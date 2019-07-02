const bookshelf = require('../lib/bookshelf');
require('./vmConfig');

module.exports = bookshelf.model('Vm', {
  tableName: 'vms',
  configs() {
    return this.hasMany('VmConfig');
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
  },

  update(property) {
    return this.set(property).save();
  },

  async updateConfig(cfg) {
    const configs = await this.configs().fetch({ withRelated: ['vmOptionTemplate'] });

    return await bookshelf.transaction(async (t) => {
      for (let [templateId, config] of Object.entries(cfg)) {
        let curCfg = configs.find((c) => c.get('vm_option_template_id') === templateId);

        if (curCfg) {
          await curCfg.set({ 'value': config }).save(null, { transacting: t });
        } else {
          await new VmConfig({  vm_option_template_id: parseInt(templateId), value: JSON.stringify(config), editable: true })
            .save({ vm_id: this.id }, {transacting: t});
        }
      }

      return this;
    });
  },

  async delete() {
    return await bookshelf.transaction(async (t) => {
      const configs = await this.configs().fetch();
      for (let c of configs) {
        await c.destroy({ transacting: t });
      }

      return await this.destroy({transacting: t});
    });
  }
});
