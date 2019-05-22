const Router = require('koa-router');
const router = new Router();

const local = {};
local.userController = require('../controllers/UserController');

router.all('/:controller/:action', async (ctx, next) => {
  let { controller, action } = ctx.params;
  switch (action) {
    case 'new':
      action = 'build';
      break;
  }
  // ctx.response.body = '{"ABC":"FOUND"}';

  await local[controller + 'Controller'][action](ctx);
});

module.exports = router;
