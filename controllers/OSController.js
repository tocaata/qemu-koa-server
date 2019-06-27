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

  build: async (ctx) => {
    const { name, type, detail, templates } = ctx.request.body;

    const result = await bookshelf.transaction(async t => {
      await new OS({ name, type, detail })
        .save(null, { transacting: t })
        .tap(async os => {
          return await Promise.all(
            templates.map(tempId => {
              return new OSTemplate({ os_id: os.id, vm_option_template_id: tempId }).save({}, {transacting: t});
            })
          )
        });
    });

    ctx.body = response.success(null, "Create OS template successfully!")
  }
};
