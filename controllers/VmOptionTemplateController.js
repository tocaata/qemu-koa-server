const VmOptionTemplate = require('../models/vmOptionTemplate');
const response = require('../lib/response');

module.exports = {
  build: async (ctx) => {
    const object = ctx.request.body;

    const option = await new VmOptionTemplate({ name: object.title, arg: JSON.stringify(object.arg), type: object.type,
      is_primary: object.isPrimary, config: JSON.stringify(object) }).save();

    if (option.id > 0) {
      ctx.body = response.success({}, "Create new KVM option successfully!");
    } else {
      ctx.body = response.fail("Create new KVM option successfully!");
    }
  },

  list: async (ctx) => {
    const { pageIndex, pageSize, searchStr, orderBy, ascending } = ctx.request.body;

    const options = await VmOptionTemplate.query(qb => {
      if (searchStr && searchStr.length > 0) {
        qb.whereRaw(`CONCAT(\`name\`, \`arg\`) like '%${ searchStr.replace(/'/g, `\\'`) }%'`);
      }
    }).orderBy(`${ ascending ? '' : '-' }${orderBy}`).fetchPage({ pageSize, page: pageIndex });
    const optionsJson = options ? options.toJSON() : undefined;

    ctx.body = response.success({ list: optionsJson, totalSize: options.pagination.rowCount }, "Get option list successfully!");
  },

  delete: async (ctx) => {
    const { id } = ctx.request.body;
    const template = await VmOptionTemplate.where({ id }).fetch();
    const ret = await template.delete();

    ctx.body = response.success(undefined, "Delete vm arg successfully!")
  },

  update: async (ctx) => {
    const { id, arg, type, isPrimary, template, title, desc, params} = ctx.request.body;
    const config = { arg, type, isPrimary, template, title, desc, params };
    let theArg = await VmOptionTemplate.where({ id }).fetch();

    if (theArg) {
      theArg = await theArg.set({ name: title, type, arg: JSON.stringify(arg), is_primary: isPrimary, config: JSON.stringify(config) }).save();
      ctx.body = response.success(theArg.toJSON(), "Update argument template successfully!")
    } else {
      ctx.throw("No this argument template.");
    }
  },

  all: async (ctx) => {
    const { enabled } = ctx.request.query;
    const queryObj = {};

    if (enabled != null) {
      queryObj['is_primary'] = enabled === 1 || enabled === true || enabled === 'true';
    }

    const allOptions = await VmOptionTemplate.where(queryObj).fetchAll();
    ctx.body = response.success(allOptions.toJSON(), "Get all options");
  }
};
