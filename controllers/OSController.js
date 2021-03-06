const OS = require('../models/os');
const OSTemplate = require('../models/osTemplate');
const response = require('../lib/response');
const bookshelf = require('../lib/bookshelf');

module.exports = {
  list: async (ctx) => {
    const { pageIndex, pageSize, searchStr, ascending, orderBy } = ctx.request.body;
    const OSs = await OS.query(qb => {
      if (searchStr && searchStr.length > 0) {
        qb.whereRaw(`CONCAT(\`name\`, \`type\`, \`detail\`) like '%${ searchStr.replace(/'/g, `\\'`) }%'`);
      }
    }).orderBy(`${ ascending ? '' : '-' }${orderBy}`).fetchPage({ pageSize, page: pageIndex });

    const OSJson = OSs ? OSs.toJSON() : undefined;

    ctx.body = response.success({ list: OSJson, totalSize: OSs.pagination.rowCount}, "Get OS list successfully!");
  },

  enabled: async (ctx) => {
    const OSs = await OS.where({ enabled: 1 }).fetchAll();
    const OSJson = OSs && OSs.toJSON();

    ctx.body = response.success(OSJson, "Get enabled OS template successfully!");
  },

  build: async (ctx) => {
    const { name, type, icon, detail, enabled, templates } = ctx.request.body;

    const result = await bookshelf.transaction(async t => {
      await new OS({ name, type, icon, enabled, detail })
        .save(null, { transacting: t })
        .tap(async os => {
          return await Promise.all(
            templates.map(tempId => {
              return new OSTemplate({ os_id: os.id, vm_option_template_id: tempId }).save({}, {transacting: t});
            })
          )
        });
    });


    ctx.body = response.success(result && result.toJSON(), "Create OS template successfully!")
  },

  update: async (ctx) => {
    const { id, name, type, icon, detail, enabled, templates } = ctx.request.body;

    const os = await OS.where({ id }).fetch();
    await os.update({ name, type, icon, detail, enabled}, templates);

    ctx.body = response.success(null, "Update OS template successfully!")
  },

  detail: async (ctx) => {
    const { id } = ctx.request.body;

    const os = await OS.where({ id }).fetch({ withRelated: ['vmOptionTemplates'] });

    if (os) {
      ctx.body = response.success(os.toJSON(), "Get OS detail.");
    }
  },

  delete: async (ctx) => {
    const { id } = ctx.request.body;
    const os = await OS.where({ id }).fetch();
    const result = await os.delete();

    ctx.body = response.success(undefined, "Delete OS Template successfully!");
  },
};
