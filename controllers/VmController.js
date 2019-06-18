const bookshelf = require('../lib/bookshelf');
const Vm = require('../models/vm');
const VmConfig = require('../models/vmConfig');
const VmOptionTemplate = require('../models/vmOptionTemplate');
const response = require('../lib/response');
const runingMachines = require('../lib/runingMachines');

module.exports = {
  list: async (ctx) => {
    const { name, os, pageIndex, pageSize, orderBy, ascending } = ctx.request.body;
    const vms = await Vm.query({ }).orderBy(`${ ascending ? '' : '-' }${orderBy}`).fetchPage({ pageSize, page: pageIndex });
    const vmsJson = vms ? vms.toJSON() : undefined;

    ctx.body = response.success({ list: vmsJson, totalSize: vms.pagination.rowCount}, "Get vm list successfully!");
  },

  create: async (ctx) => {
    const { name, arguments: args } = ctx.request.body;

    const vm = await bookshelf.transaction(async (t) => {
      return await new Vm({ name, status: 0, auto_boot: false })
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
    const result = await runingMachines.delete(machine);

    ctx.body = response.success(undefined, "Delete machine successfully!");
  },

  newOption: async (ctx) => {
    const object = ctx.request.body;

    const option = await new VmOptionTemplate({ name: object.title, arg: object.arg, is_primary: object.isPrimary, config: JSON.stringify(object) }).save();
    if (option.id > 0) {
      ctx.body = response.success({}, "Create new KVM option successfully!");
    } else {
      ctx.body = response.fail("Create new KVM option successfully!");
    }
  },

  listOption: async (ctx) => {
    const { pageIndex, pageSize } = ctx.request.body;

    const options = await VmOptionTemplate.query({}).fetchPage({ pageSize, page: pageIndex });
    const optionsJson = options ? options.toJSON() : undefined;

    ctx.body = response.success({ list: optionsJson, totalSize: options.pagination.rowCount }, "Get option list successfully!");
  },

  primaryOptions: async (ctx) => {
    const allOptions = await VmOptionTemplate.where({ is_primary: true }).fetchAll();
    ctx.body = response.success(allOptions.toJSON(), "Get all primary options");
  },

  deleteArg: async (ctx) => {
    const { id } = ctx.request.body;
    const template = await VmOptionTemplate.where({ id }).fetch();
    const ret = await template.delete();

    ctx.body = response.success(undefined, "Delete vm arg successfully!")
  },

  getCmd: async (ctx) => {
    const { id } = ctx.request.body;
    const machine = await Vm.where({ id }).fetch();
    const result = await runingMachines.exec('getCmd', machine);
    ctx.body = response.success(result, "Get Machine Command Arguments Successfully.")
  },

  run: async (ctx) => {
    const { id } = ctx.request.body;
    const machine = await Vm.where({ id }).fetch();
    const result = await runingMachines.start(machine);

    ctx.body = response.success(result, "Machine Start Up.")
  }
};
