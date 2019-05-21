const Router = require('koa-router');
const router = new Router();

router.prefix('/user');

router.get('/', async (ctx) => {
  ctx.response.body = 'this is a users response!';
});

router.get('/bar', async (ctx) => {
  ctx.response.body = 'this is a users/bar response!';
});

router.post('/new', async (ctx) => {
  const data = JSON.parse(ctx['request']['body']);
  ctx;
});

module.exports = router;
