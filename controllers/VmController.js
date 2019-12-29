const bookshelf = require('../lib/bookshelf');
const Vm = require('../models/vm');
const VmConfig = require('../models/vmConfig');
const VmOptionTemplate = require('../models/vmOptionTemplate');
const response = require('../lib/response');
const runningMachines = require('../lib/runningMachines');
const bus = require('../lib/bus');

module.exports = {
  list: async (ctx) => {
    const { searchStr, pageIndex, pageSize, orderBy, ascending } = ctx.request.body;
    const vms = await Vm.query(qb => {
      if (searchStr && searchStr.length > 0) {
        qb.whereRaw(`CONCAT(\`name\`) like '%${ searchStr.replace(/'/g, `\\'`) }%'`);
      }
    }).orderBy(`${ ascending ? '' : '-' }${orderBy}`).fetchPage({ pageSize, page: pageIndex, withRelated: ['os'] });
    const vmsJson = vms ? vms.toJSON() : undefined;
    vmsJson.forEach(x => {
      const machine = runningMachines.runningMachines.find(y => y.id === x.id);
      if (machine != null) {
        x.status = machine.vmStatus;
      } else {
        x.status = 'stopped';
      }
    });
    ctx.body = response.success({ list: vmsJson, totalSize: vms.pagination.rowCount}, "Get vm list successfully!");
  },

  create: async (ctx) => {
    const { name, arguments: args, osId } = ctx.request.body;

    const vm = await bookshelf.transaction(async (t) => {
      return await new Vm({ name, os_id: osId, status: 0, auto_boot: false })
        .save(null, {transacting: t})
        .tap(async (m) => {
          return await Promise.all(Object.entries(args).map(( async ([id, config]) => {
            return await new VmConfig({ vm_option_template_id: parseInt(id), value: JSON.stringify(config), editable: true})
              .save({ vm_id: m.id }, {transacting: t});
          })));
        });
    });
    // console.log(vm.related('configs'));

    ctx.body = response.success(undefined, "Create machine successfully!");
  },

  delete: async (ctx) => {
    const { id } = ctx.request.body;
    const machine = await Vm.where({ id }).fetch();
    const result = await runningMachines.delete(machine);

    ctx.body = response.success(undefined, "Delete machine successfully!");
  },

  primaryOptions: async (ctx) => {
    const allOptions = await VmOptionTemplate.where({ is_primary: true }).fetchAll();
    ctx.body = response.success(allOptions.toJSON(), "Get all primary options");
  },

  getCmd: async (ctx) => {
    const { id } = ctx.request.body;
    const machine = await Vm.where({ id }).fetch();
    const result = await runningMachines.exec(machine, 'getCmd');
    ctx.body = response.success(result, "Get Machine Command Arguments Successfully.");
  },

  detail: async (ctx) => {
    const { id } = ctx.query;
    const machine = await Vm.where({ id }).fetch({ withRelated: ['configs', 'configs.vmOptionTemplate'] });
    let json = machine.toJSON();
    json.vmOptionTemplates = json.configs.map(x => {
      let template = x.vmOptionTemplate;
      delete x['vmOptionTemplate'];
      template.values = x;
      return template;
    });
    delete json.configs;

    ctx.body = response.success(json, "Get machine detail.");
  },

  deleteConfig: async (ctx) => {
    const { configId, machineId } = ctx.request.body;
    const machine = await Vm.where({ id: machineId }).fetch();
    const result = await machine.deleteConfig(configId);

    ctx.body = response.success(result, 'Delete machine argument config.');
  },

  addConfig: async (ctx) => {
    const { templateId, machineId } = ctx.request.body;
    const machine = await Vm.where({ id: machineId }).fetch();
    const result = await machine.addConfig(templateId);

    ctx.body = response.success(result, 'Add machine argument config.');
  },

  editConfig: async (ctx) => {
    const { configId, machineId, configParams } = ctx.request.body;
    const machine = await Vm.where({ id: machineId }).fetch();
    const result = await machine.updateConfig(configId, configParams);

    ctx.body = response.success(result, 'Update machine argument config.');
  },

  update: async (ctx) => {
    const { id, autoBoot, name } = ctx.request.body;
    const machine = await Vm.where({ id }).fetch();
    const result = await machine.update({ auto_boot: autoBoot, name});

    bus.emit('toAll', 'updateMachineList', { message: 'Update virtual machine successfully.' });

    ctx.body = response.success(result, 'Update virtual machine successfully.')
  },

  run: async (ctx) => {
    const { id } = ctx.request.body;
    const machine = await Vm.where({ id }).fetch();
    const result = await runningMachines.start(machine);

    ctx.body = response.success(result, "Machine Start Up.");
  },

  exec: async (ctx) => {
    const { id, cmd, args } = ctx.request.body;
    const machine = await Vm.where({ id }).fetch();
    const result = await runningMachines.exec(machine, cmd, args);

    ctx.body = response.success(result, "Machine QMP command is run.");
  }
};
