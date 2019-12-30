const bookshelf = require('../lib/bookshelf');

const Setting = bookshelf.model('Setting', {
    tableName: 'settings',
});

module.exports = Setting;