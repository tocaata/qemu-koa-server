let io = null;

const socket = (server) => {
  io = require('socket.io')(server);
  io.on('connection', (server) => {


    setTimeout(() => {
      console.log('send message');
      broadcast('updateMachineList', {});
    }, 2000);

    console.log('socket io');

    server.on('das', data => {
      console.log('test');
    });

    server.on('disconnect', () => {
      /* … */
    });
  })
};

const broadcast = (event, data) => {
  console.log(`broadcast event: ${event}, data: ${JSON.stringify(data)}`);
  io && io.emit(event, data);
};

module.exports = {
  socket,
  broadcast
};
