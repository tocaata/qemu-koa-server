const Setting = require('../models/setting');
const response = require('../lib/response');

module.exports = {
    list: async (ctx) => {
        const {pageIndex, pageSize, searchStr} = ctx.request.body;
        const settings = await Setting.query(qb => {
            if (searchStr && searchStr.length > 0) {
                qb.whereRaw(`CONCAT(\`name\`, \`type\`) like '%${searchStr.replace(/'/g, `\\'`)}%'`);
            }
        }).fetchPage({pageSize, page: pageIndex});

        const settingJson = settings ? settings.toJSON() : undefined;

        ctx.body = response.success(
            {list: settingJson, totalSize: settings.pagination.rowCount},
            "Get Setting list successfully!"
        );
    },

    build: async (ctx) => {
        const {name, type, value} = ctx.request.body;

        const newSetting = await new Setting({name, type, value}).save();

        ctx.body = response.success(newSetting.toJSON(), "Add new setting successfully!");
    },

    update: async (ctx) => {
        const {id, name, type, value} = ctx.request.body;

        const setting = await Setting.where({ id }).fetch();
        await setting.update({id, name, type, value});
        const updatedSetting = await setting.refresh();

        ctx.body = response.success(updatedSetting, "Update Setting successfully!");
    },

    delete: async (ctx) => {
        const {id} = ctx.request.body;

        const setting = await Setting.where({ id }).fetch();
        await setting.destroy();

        ctx.body = response.success({}, "Delete Setting successfully!");
    }
};
