const bookshelf = require('../lib/bookshelf');
require('./vmConfig');
require('./os');

module.exports = bookshelf.model('Vm', {
  tableName: 'vms',
  configs() {
    return this.hasMany('VmConfig');
  },

  os() {
    return this.belongsTo('OS', 'os_id');
  },

  async getCmd() {
    const configs = await this.configs().fetch({withRelated: ['vmOptionTemplate']});
    const argTemplates = [];

    configs.forEach(c => {
      const optionTemplate = c.related('vmOptionTemplate'), kvs = JSON.parse(c.get('value'));
      const config = JSON.parse(optionTemplate.get('config')), args = config.arg || [];

      let templates = config.template || [];

      for (let [k, v] of Object.entries(kvs)) {
        templates = templates.map(item => item && item.replace(new RegExp(k, 'g'), v));
      }

      for (let i = 0; i < args.length; i++) {
        argTemplates.push([args[i], templates[i]])
      }
    });

    return argTemplates;
  },

  update(property) {
    return this.set(property).save();
  },

  async addConfig(templateId) {
    return this.configs().add({ vm_id: parseInt(this.id), vm_option_template_id: templateId, editable: 1, value: '{}' })
      .invokeThen('save');
  },

  async updateConfig(configId, configParams) {
    // const configs = await this.configs().fetch();
    const config = await bookshelf.model('VmConfig').where({ id: configId }).fetch();
    return await config.set({ value: JSON.stringify(configParams) }).save();

    // return await bookshelf.transaction(async (t) => {
    //   for (let [templateId, config] of Object.entries(cfg)) {
    //     let curCfg = configs.find((c) => c.get('vm_option_template_id') === templateId);
    //
    //     if (curCfg) {
    //       await curCfg.set({ 'value': config }).save(null, { transacting: t });
    //     } else {
    //       await new VmConfig({  vm_option_template_id: parseInt(templateId), value: JSON.stringify(config), editable: true })
    //         .save({ vm_id: this.id }, {transacting: t});
    //     }
    //   }

      // return this;
    // });
  },

  async deleteConfig(configId) {
    // const config = await bookshelf.model('VmConfig').where({ id: configId }).fetch();
    let configs = await this.configs().fetch();
    return await configs.get(configId).destroy();
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
