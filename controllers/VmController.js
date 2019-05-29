const { Vm, VmConfig } = require('../models/vm');
const VmOptionTemplate = require('../models/vmOptionTemplate');
const response = require('../lib/response');
const bookshelf = require('../lib/bookshelf');

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
      await new Vm({ name, status: 0, auto_boot: false })
        .save(null, {transacting: t})
        .tap(async (m) => {
          return await Promise.all(args.map((config => {
            return new VmConfig({ name: config[0], value: config[1], editable: true}).save({ vm_id: m.id }, {transacting: t});
          })));
        });
    });
    console.log(vm.related('configs'));

    ctx.body = response.success(undefined, "Create machine successfully!")
  },

  newOption: async (ctx) => {
    const object = ctx.request.body;

    if (object.isPrimary) {
      if (await VmOptionTemplate.where({ arg: object.arg, is_primary: true }).fetch()) {
        ctx.throw("Conflict! a same primary kvm arg exists. Please set primary to false!");
      }
    }

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
    await VmOptionTemplate.where({ id }).destroy();

    ctx.body = response.success(undefined, "Delete vm arg successfully!")
  }
};
