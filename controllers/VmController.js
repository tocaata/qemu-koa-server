const Vm = require('../models/vm');
const Session = require('../models/session');
const response = require('../lib/response');

module.exports = {
  list: async (ctx) => {
    const { name, os, pageIndex, pageSize, orderBy, ascending } = ctx.request.body;
    const vms = await Vm.query({ }).orderBy(`${ ascending ? '' : '-' }${orderBy}`).fetchPage({ pageSize, page: pageIndex });
    const vmsJson = vms ? vms.toJSON() : undefined;

    ctx.response.body = response.success({ list: vmsJson, totalSize: vms.pagination.rowCount}, "Get vm list successfully!");
  }
};
