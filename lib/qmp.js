const Net = require('net');


class Qmp {
  constructor(vmName, eventHandler) {
    this.vmName = vmName;
    this.socket = void 0;
    this.port = void 0;
    this.close = false;
    this.commands =[];
    this.eventHandler = eventHandler;
    this.cmdRunnerStatus = "stopping";
  }

  stopReconnect() {
    console.log("Stop reconnect caught");
    return this.close = true;
  }

  connect(port) {
    if (typeof(port) === 'number') {
      this.port = port;
    }

    console.log(`QMP: try to connect to VM ${this.vmName} with port ${this.port}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.socket = Net.connect(this.port, () => {
          console.log(`QMP: connected to VM ${this.vmName}`);
        });

        // listen on connect event
        this.socket.on('connect', () => {
          console.log(`qmp connected to ${this.vmName}`);
          this.socket.write('{"execute":"qmp_capabilities"}');
          resolve({ status: 'success' });
        });
      }, 1000);
    });
  }

  listen() {
    // listen on error
    this.socket.on('error', (e) => {
      if (e.message === 'This socket has been ended by the other party') {
        console.log('QEMU closed connection');
      } else if (this.close !== true) {
        console.error('QMP: ConnectError try reconnect');
        return this.connect();
      } else {
        let reject = void 0;

        if (this.commands.length > 0) {
          reject = this.commands.splice(0, 1)[2];

          if (typeof(reject) === 'function') {
            reject(e);
          }
        }
      }
    });

    this.socket.on('data', (data) => {
      let e, event, jsons, parsedData;
      jsons = data.toString().split('\r\n');
      jsons.pop();
      for (let json of jsons) {
        try {
          parsedData = JSON.parse(json.toString());
          event = parsedData.event;

          console.log(" - - - QMP-START-DATA - - -");
          console.log(util.inspect(parsedData).slice(0, 256));
          console.log(" - - - QMP-END-DATA - - -");

          let ret = parsedData["return"];
          if (ret['status'] != null && ret['singlestep'] != null && ret['running'] != null) {
            parsedData.timestamp = new Date().getTime();
            if (ret['status'] === 'paused') {
              event = 'STOP';
            } else if (ret['status'] === 'running' && ret['running'] === true) {
              parsedData.timestamp = new Date().getTime();
              event = 'RESUME';
            }
          }
          if ((parsedData.timestamp != null) && (event != null)) {
            if (this.eventHandler[event] != null) {
              console.log("QMP: call vmHandler[" + event + "] for VM " + this.vmName);
              this.eventHandler[event]();
            }
          }

          let resolve = void 0, reject = void 0;

          if (this.commands.length > 0) {
            [_, resolve, reject] = this.commands.splice(0, 1);
          }

          if (typeof(resolve) === 'function' && typeof(reject) === 'function') {
            if (parsedData.error != null) {
              reject({
                'error': parsedData.error
              });
            } else if (parsedData.timestamp != null) {
              continue;
            } else if (parsedData["return"] != null) {
              if (0 === Object.keys(ret).length) {
                resolve({
                  status: 'success'
                });
              } else {
                resolve({
                  'data': ret
                });
              }
            } else {
              console.error("cant process Data");
              console.error(parsedData);
            }
          }
        } catch (_error) {
          e = _error;
          console.error("cant parse returned json, Buffer is:");
          console.error(json.toString());
          console.error("error is:");
          console.dir(e);
        }
      }
    });
  }

  cmdRun() {
    if (this.cmdRunnerStatus !== 'running' && this.commands.length > 0) {
      this.cmdRunnerStatus = 'running';

      while (this.commands.length > 0) {
        let [cmdObj] = this.commands[0];
        this.socket.write(JSON.stringify(cmdObj));
      }
    }
  }

  sendCmd(cmd, args) {
    const ret = new Promise((resolve, reject) => {
      this.commands.push([{
        execute: cmd,
        "arguments": args
      }, resolve, reject]);
    });

    setTimeout(() => {
      this.cmdRun();
    });
    return ret;
  }

  reconnect(port) {
    return this.connect(port);
  }

  /*
  #   QMP commands
  */


  pause() {
    return this.sendCmd('stop');
  }

  reset() {
    return this.sendCmd('system_reset');
  }

  resume() {
    return this.sendCmd('cont');
  }

  shutdown() {
    return this.sendCmd('system_powerdown');
  }

  stop() {
    return this.sendCmd('quit');
  }

  status() {
    return this.sendCmd('query-status');
  }

  balloon(mem) {
    return this.sendCmd('balloon', {
      value: mem
    });
  }

  setVncPass(pass) {
    return this.sendCmd('change', {
      'device': 'vnc',
      'target': 'password',
      'arg': pass
    });
  }

  attachHid() {
    return this.sendCmd("device_add", {
      'driver': 'usb-host',
      'vendorid': '1133',
      'productid': '49734',
      'bus': this.usb_bus
    }, (result) => {
      return this.sendCmd("device_add", {
        'driver': 'usb-host',
        'vendorid': '6940',
        'productid': '6919',
        'bus': this.usb_bus
      }, (result1) => {return cb()});
    });
  }

}

module.exports = { Qmp };
