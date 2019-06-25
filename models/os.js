const bookshelf = require('../lib/bookshelf');
require('./vmOptionTemplate');

const OS = bookshelf.model('OS', {
  tableName: 'oss',

  // vmOptionTemplates() {
  //   return this.hasMany('VmOptionTemplate');
  // },


  async delete() {
  }
});

module.exports = OS;
