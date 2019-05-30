const User = require('../models/user');
const Session = require('../models/session');

const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const response = require('../lib/response');

module.exports = {
  list: async (ctx) => {
    const { pageIndex, pageSize } = ctx.request.body;

    const users = await User.query({}).orderBy('-created_at').fetchPage({ pageSize, page: pageIndex });
    const usersJson = users.toJSON();

    ctx.response.body = response.success({ list: usersJson, totalSize: users.pagination.rowCount}, "Get user list successfully!");
  },

  delete: async (ctx) => {
    const { userId } = ctx.request.body;
    const userDeletable = await User.where({ id: userId }).destroy();

    console.log(userDeletable);

    ctx.body = response.success(undefined, "Delete user successfully.");
  },

  detail: async (ctx) => {
    // const token = ctx['request']['body']['token'];
    const user = ctx.state.user;

    const res = user.toJSON();
    delete res['password_hash'];
    res.roles = ['admin'];
    ctx.body = response.success(res, "Get user info successfully.");
  },

  login: async (ctx) => {
    const data = ctx['request']['body'];

    const { username, password } = data;
    const password_hash = crypto.createHash('sha256').update(password).digest('base64');

    const user = await User.where({ username }).fetch()
      , sessionId = uuidv4();

    ctx.assert(user && user.get('password_hash') === password_hash,
      403, "Please input correct user name and password.");
    await new Session({ session_id: sessionId, data: JSON.stringify({ user_id: user.id}) }).save();
    // ctx.cookies.set('Admin-Token', sessionId, { expires:  moment().add(1, 'hours').toDate()});
    ctx.body = response.success({ userId: user.get('id'), token: sessionId, roles: ['admin'] }, `welcome to qemu-koa-server!`);
  },

  logout: async (ctx) => {
    const sessionId = ctx.cookies.get('Admin-Token') || ctx.req.headers['x-token'];
    await Session.where({ session_id: sessionId}).destroy();
    ctx.cookies.set('Admin-Token');
    ctx.body = response.success(undefined, 'You have logout.');
  },

  build: async (ctx) => {
    const data = ctx['request']['body'];
      if (!('username' in data)) {
        ctx.throw("Need username.");
      }

      if (!('name' in data)) {
        ctx.throw("Create user need parameter: name");
      }

      if (!('password' in data)) {
        ctx.throw("Need user password.");
      }

      const { username, name, password, detail, email } = data;

      if (await User.where({username}).fetch()) {
        ctx.throw(`Username ${username} exists!`);
      }


      const password_hash = crypto.createHash('sha256').update(password).digest('base64');

      const user = await User.forge({username, name, password_hash, detail, email}).save();
      ctx.response.body = response.success(undefined, `Create user ${name} successfully.`);
  }
};
