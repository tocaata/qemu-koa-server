const bookshelf = require('../lib/bookshelf');
require('./vmOptionTemplate');
require('./osTemplate');

const OS = bookshelf.model('OS', {
  tableName: 'oss',

  vmOptionTemplates() {
    return this.hasMany('VmOptionTemplate').through('OSTemplate');
  },


  async delete() {
  }
});

module.exports = OS;
