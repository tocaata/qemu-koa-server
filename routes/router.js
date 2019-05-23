const Router = require('koa-router');
const router = new Router();

const local = {};
local.userController = require('../controllers/UserController');
local.vmController = require('../controllers/vmController');

router.all('/:controller/:action', async (ctx, next) => {
  let { controller, action } = ctx.params;
  switch (action) {
    case 'new':
      action = 'build';
      break;
  }
  if (controller + 'Controller' in local && action in local[controller + 'Controller']) {
    await local[controller + 'Controller'][action](ctx);
  } else {
    ctx.throw(400, 'Not Found', { code: 400, status: 'FAIL' });
  }
});


router.all('/:controller/:action/:id', async (ctx, next) => {
  let { controller, action } = ctx.params;
  if (controller + 'Controller' in local && action in local[controller + 'Controller']) {
    await local[controller + 'Controller'][action](ctx);
  } else {
    ctx.throw(400, 'Not Found', { code: 400, status: 'FAIL' });
  }
});

module.exports = router;
