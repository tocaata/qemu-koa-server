const Net = require('net');


class Qmp {
  constructor(vmName) {
    this.vmName = vmName;
    this.socket = void 0;
    this.port = void 0;
    this.dataCb = void 0;
    this.close = false;
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
        this.socket.on('connect', (data) => {
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
      }
    });

    this.socket.on('data', (data) => {
      let callback, e, event, json, jsons, parsedData, _i, _len, _ref, _ref1, _ref2, _results;
      jsons = data.toString().split('\r\n');
      jsons.pop();
      _results = [];
      for (_i = 0, _len = jsons.length; _i < _len; _i++) {
        json = jsons[_i];
        try {
          parsedData = JSON.parse(json.toString());
          if (parsedData.event != null) {
            event = parsedData.event;
          } else {
            event = void 0;
          }
          console.log(" - - - QMP-START-DATA - - -");
          console.log(util.inspect(parsedData).slice(0, 256));
          console.log(" - - - QMP-END-DATA - - -");
          if ((((_ref = parsedData["return"]) != null ? _ref.status : void 0) != null) && (((_ref1 = parsedData["return"]) != null ? _ref1.singlestep : void 0) != null) && (((_ref2 = parsedData["return"]) != null ? _ref2.running : void 0) != null)) {
            parsedData.timestamp = new Date().getTime();
            if (parsedData["return"].status === 'paused') {
              event = 'STOP';
            } else if (parsedData["return"].status === 'running' && parsedData["return"].running === true) {
              parsedData.timestamp = new Date().getTime();
              event = 'RESUME';
            }
          }
          if ((parsedData.timestamp != null) && (event != null)) {
            if (vmHandler[event] != null) {
              console.log("QMP: call vmHandler[" + event + "] for VM " + this.vmName);
              vmHandler[event](this.vmName);
            }
          }
          if (this.dataCb != null) {
            callback = this.dataCb;
            if (parsedData.error != null) {
              this.dataCb = void 0;
              _results.push(callback({
                'error': parsedData.error
              }));
            } else if (parsedData.timestamp != null) {
              continue;
            } else if (parsedData["return"] != null) {
              this.dataCb = void 0;
              if (0 === Object.keys(parsedData["return"]).length) {
                _results.push(callback({
                  status: 'success'
                }));
              } else {
                _results.push(callback({
                  'data': parsedData["return"]
                }));
              }
            } else {
              console.error("cant process Data");
              _results.push(console.error(parsedData));
            }
          } else {

          }
        } catch (_error) {
          e = _error;
          console.error("cant parse returned json, Buffer is:");
          console.error(json.toString());
          console.error("error is:");
          _results.push(console.dir(e));
        }
      }
      return _results;
    });
  }

  sendCmd(cmd, args, cb) {
    if (typeof args === 'function') {
      this.dataCb = args;
      return this.socket.write(JSON.stringify({
        execute: cmd
      }));
    } else {
      this.dataCb = cb;
      return this.socket.write(JSON.stringify({
        execute: cmd,
        "arguments": args
      }));
    }
  }

  reconnect(port, cb) {
    return this.connect(port, cb);
  }

  /*
  #   QMP commands
  */


  pause(cb) {
    return this.sendCmd('stop', cb);
  }

  reset(cb) {
    return this.sendCmd('system_reset', cb);
  }

  resume(cb) {
    return this.sendCmd('cont', cb);
  }

  shutdown(cb) {
    return this.sendCmd('system_powerdown', cb);
  }

  stop(cb) {
    return this.sendCmd('quit', cb);
  }

  status() {
    return this.sendCmd('query-status', function() {});
  }

  balloon(mem, cb) {
    return this.sendCmd('balloon', {
      value: mem
    }, cb);
  }

  setVncPass(pass, cb) {
    return this.sendCmd('change', {
      'device': 'vnc',
      'target': 'password',
      'arg': pass
    }, cb);
  }

  attachHid(cb) {
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

  unattachHid(cb) {
    var that, tmp;
    that = this;
    return tmp = new Promise(function(resolve, reject) {
      return that.sendCmd("qom-list", {'path': '/machine/unattached'},
        function(result) {
          let hids = result.data.filter((obj) => obj.type === "child<usb-host>").map((d) => {
            return {'id': "/machine/unattached/" + r.name};
          });
          return resolve(hids);
        });
    }).then(function(hids) {
      return tmp = new Promise(function(resolve, reject) {
        return that.sendCmd("qom-list", {'path': '/machine/peripheral-anon'},
          function(result) {
            let hids = result.data.filter((obj) => obj.type === "child<usb-host>").map((d) => {
              return {'id': "/machine/peripheral-anon/" + r.name};
            });
            return resolve(hids);
          });
      });
    }).then(function(hids) {
      if (hids.length === 0) {
        return cb();
      } else {
        return hids.reduce(
          (x, y) => (() => (that.sendCmd("device_del", y, x))),
          () => (that.sendCmd("device_del", hids[0], cb)))();
      }
    };
  }

}
