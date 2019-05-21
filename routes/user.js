const Router = require('koa-router');
const router = new Router();
const User = require('../models/user');
const Session = require('../models/session');

const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

router.prefix('/user');

router.get('/', async (ctx) => {
  ctx.response.body = 'this is a users response!';
});

router.get('/bar', async (ctx) => {
  ctx.response.body = 'this is a users/bar response!';
});

router.post('/new', async (ctx) => {
  const data = ctx['request']['body'];
  try {
    if (!'name' in data ) {
      ctx.response.body = { status: 'FAIL', message: "Need user name."};
      return;
    }
    if (!'password' in data) {
      ctx.response.body = { status: 'FAIL', message: "Need user password."};
      return;
    }

    const { username, name, password, detail } = data;
    const password_hash = crypto.createHash('sha256').update(password).digest('base64');

    User.forge({ username, name, password_hash, detail }).save().then(user => {
      console.log(user);
      ctx.response.body = { status: 'SUCCESS', message: `Create user ${name} successfully.`};
    });
  } catch (e) {
    ctx.response.body = { status: 'FAIL', message: e.message };
  }
});

router.post('/login', async (ctx) => {
  const data = ctx['request']['body'];

  try {
    const { username, password } = data;
    const password_hash = crypto.createHash('sha256').update(password).digest('base64');

    const user = await User.where({ username }).fetch()
      , sessionId = uuidv4();
    if (user.get('password_hash') === password_hash) {
      await Session.forge({ id: sessionId, data: JSON.stringify({ user_id: user.id}) }).save();
      ctx.cookies.set('authorization', sessionId, { signed: true });
      ctx.response.body = { status: 'SUCCESS', message: `welcome to qemu-koa-server!` };
    }
  } catch (e) {
    console.error(e);
    ctx.response.body = { status: 'FAIL', message: e.message };
  }
});

module.exports = router;
