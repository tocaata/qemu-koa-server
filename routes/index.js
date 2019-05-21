const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx) => {
  await ctx.render('index.jade', {
    title: 'Hello World Koa!'
  });
});

router.get('/foo', async (ctx) => {
  await ctx.render('index.jade', {
    title: 'Hello World foo!'
  });
});

module.exports = router;
