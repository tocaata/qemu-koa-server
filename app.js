const Koa = require('koa')
  , logger = require('koa-logger')
  , json = require('koa-json')
  , views = require('koa-views')
  , koaStatic = require('koa-static')
  , onerror = require('koa-onerror');

const app = new Koa;
const router = require('./routes/router');
const sessionController = require('./controllers/SessionController');
// const HttpError = require('http-errors');

const autoboot = require('./lib/autoboot');

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

app.use(async (ctx, next) => {
  const start = new Date;
  await next();
  const ms = new Date - start;
  console.log('%s %s - %s', ctx.method, ctx.originalUrl, ms);
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch(e) {
    if (e.name === 'BadRequestError') {
      ctx.body = { status: 'FAIL', code: 400, message: e.message };
      ctx.status = 400;
      ctx.message = e.message;
      // ctx.throw(e.code, e.message);
    } else {
      console.error(e);
      ctx.body = { status: "FAIL", code: 40000, message: e.message };
      // ctx.status = e.status;
    }
  }
});

app.use(koaStatic(__dirname + '/public'));

// Get user session.
app.use(sessionController);

app.use(router.routes()).use(router.allowedMethods());

// error-handling
// app.on('error', (err, ctx) => {
//   console.error('server error', err, ctx);
// });

autoboot();

module.exports = app;
