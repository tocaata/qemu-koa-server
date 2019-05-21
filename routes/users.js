const Router = require('koa-router');
const router = new Router();

router.prefix('/users');

router.get('/', async (ctx, next) => {
  ctx.response.body = 'this is a users response!';
});

router.get('/bar', async (ctx, next) => {
  ctx.response.body = 'this is a users/bar response!';
});

module.exports = router;
