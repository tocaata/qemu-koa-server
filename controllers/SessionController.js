const Session = require('../models/session');
const User = require('../models/user');

const sessionController = async (ctx, next) => {
  if (['/user/login', '/user/logout', '/vm/test'].includes(ctx.path)) {
    await next();
  } else {
    const sessionId = ctx.cookies.get('Admin-Token') || ctx.req.headers['x-token'];
    ctx.assert(sessionId, 401, 'Unauthorized!');

    const session = await Session.where({session_id: sessionId}).fetch();
    ctx.state = JSON.parse(session.get('data'));
    ctx.state.user = await User.where({id: ctx.state.user_id}).fetch();

    await next();
    ctx.assert(ctx.state.user, 401, "User not found. Please login!");
  }
};

module.exports = sessionController;
