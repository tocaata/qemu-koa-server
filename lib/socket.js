const bus = require('./bus');
let io = null;

module.exports = {
  socket: (server) => {
    io = require('socket.io')(server);
    io.on('connection', (server) => {


      setTimeout(() => {
        console.log('send message');
        io.sockets.emit('updateMachineList', {});
      }, 2000);

      console.log('socket io');

      server.on('das', data => {
        console.log('test');
      });

      server.on('disconnect', () => {
        /* … */
      });
    })
  },

  broadcast: (event, data) => {
    console.log(`broadcast event: ${event}, data: ${JSON.stringify(data)}`);
    io && io.emit(event, data);
  }
};
