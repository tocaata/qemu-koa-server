const SessionController = require('../models/session');
const User = require('../models/user');

const sessionController = async (ctx, next) => {
  try {
    const sessionId = ctx.cookies.get('Admin-Token');
    const session = await SessionController.where({session_id: sessionId}).fetch();
    ctx.session = JSON.parse(session.get('data'));
    ctx.session.user = await User.where({id: ctx.session.user_id}).fetch();
  } catch (e) {

  }
  await next();
};

module.exports = sessionController;
