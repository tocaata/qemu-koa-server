const Koa = require('koa')
  , logger = require('koa-logger')
  , json = require('koa-json')
  , views = require('koa-views')
  , koaStatic = require('koa-static')
  , onerror = require('koa-onerror');

const app = new Koa;
const index = require('./routes/index');
const user = require('./routes/user');

// error handler
onerror(app);

// global middle wares
app.use(views('views', {
  root: __dirname + '/views',
  default: 'jade'
}));

app.use(require('koa-bodyparser')());
app.use(json());
app.use(logger());

// app.use(async (ctx, next) => {
//   const start = new Date;
//   await next;
//   const ms = new Date - start;
//   console.log('%s %s - %s', this.method, this.url, ms);
// });

app.use(koaStatic(__dirname + '/public'));

app.use(index.routes()).use(index.allowedMethods());
app.use(user.routes()).use(user.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app;
