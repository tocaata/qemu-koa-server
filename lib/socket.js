const bus = require('./bus');

module.exports = function(server) {
  const io = require('socket.io')(server);
  io.on('connection', (server) => {


    setTimeout(() => {
      console.log('send message');
      io.sockets.emit('updateMachineList', {});
    }, 2000);

    console.log('socket io');
    server.on('das', data => {
      1
    });

    server.on('ads', data => {
      1
    });

    server.on('disconnect', () => {
      /* … */
    });
  });

  bus.on('toAll', (event, data) => {
    console.log('toAll');
    io.sockets.emit(event, data);
  });
};
