const User = require('../models/user');
const Session = require('../models/session');

const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const response = require('../lib/response');

module.exports = {
  list: async (ctx) => {
    const users = await User.fetchAll();
    ctx.response.body = response.success(users.toJSON(), "Get user list successfully!");
  },

  bar: async (ctx) => {
    ctx.response.body = 'this is a users/bar response!';
  },

  login: async (ctx) => {
    const data = ctx['request']['body'];

    try {
      const { username, password } = data;
      if (ctx.session && ctx.session.user && username === ctx.session.user.get('username')) {
        ctx.response.body = { status: 'FAIL', code: 20000, message: 'you have login this site.'};
        return;
      }

      const password_hash = crypto.createHash('sha256').update(password).digest('base64');

      const user = await User.where({ username }).fetch()
        , sessionId = uuidv4();
      if (user && user.get('password_hash') === password_hash) {
        await new Session({ session_id: sessionId, data: JSON.stringify({ user_id: user.id}) }).save();
        ctx.cookies.set('authorization', sessionId, { expires:  moment().add(1, 'hours').toDate()});
        ctx.response.body = { status: 'SUCCESS', code: 20000, message: `welcome to qemu-koa-server!` };
      } else {
        ctx.throw("No user.");
      }
    } catch (e) {
      console.error(e);
      ctx.response.body = { status: 'FAIL', code: 40000, message: e.message };
    }
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

      const { username, name, password, detail } = data;

      if (await User.where({username}).fetch()) {
        ctx.throw(`Username ${username} exists!`);
      }


      const password_hash = crypto.createHash('sha256').update(password).digest('base64');

      const user = await User.forge({username, name, password_hash, detail}).save();
      // console.log(user);
      ctx.response.body = response.success(undefined, `Create user ${name} successfully.`);
  }
};
