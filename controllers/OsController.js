const OS = require('../models/os');
const response = require('../lib/response');

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

  new: async (ctx) => {
  }
};
