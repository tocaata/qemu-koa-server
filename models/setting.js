const bookshelf = require('../lib/bookshelf');

const Setting = bookshelf.model('Setting', {
    tableName: 'settings',

    update(property) {
        return this.set(property).save();
    },
});

module.exports = Setting;