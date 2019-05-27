const Vm = require('../models/vm');
const VmOptionTemplate = require('../models/vmOptionTemplate');
const response = require('../lib/response');

module.exports = {
  list: async (ctx) => {
    const { name, os, pageIndex, pageSize, orderBy, ascending } = ctx.request.body;
    const vms = await Vm.query({ }).orderBy(`${ ascending ? '' : '-' }${orderBy}`).fetchPage({ pageSize, page: pageIndex });
    const vmsJson = vms ? vms.toJSON() : undefined;

    ctx.body = response.success({ list: vmsJson, totalSize: vms.pagination.rowCount}, "Get vm list successfully!");
  },

  newOption: async (ctx) => {
    const object = ctx.request.body;

    const option = await new VmOptionTemplate({ name: object.title, arg: object.arg, config: JSON.stringify(object) }).save();
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
  }
};
