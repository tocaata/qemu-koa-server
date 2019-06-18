const config = require('../config/default');

const knex = require('knex')({
  client: 'mysql',
  connection: {
    host     : config.database.HOST,
    user     : config.database.USERNAME,
    password : config.database.PASSWORD,
    database : config.database.DATABASE,
    charset  : 'utf8'
  }
});

const bookshelf = require('bookshelf')(knex);
bookshelf.plugin('pagination');
bookshelf.plugin('registry');

module.exports = bookshelf;
