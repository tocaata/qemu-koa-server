const proc = require('./process');

class Machine {
  constructor(cfg) {
    this.cfg = cfg;
    this.name = this.cfg.name;
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name, this.cfg.settings.usbBus);
    vmConf.save(this.cfg);
  }
}


class Vm {
  constructor(cfg) {
    this.cfg = cfg;
    this.name = this.cfg.name;
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name, this.cfg.settings.usbBus);
    vmConf.save(this.cfg);
  }

  edit(cfg) {
    let key, value;
    for (key in cfg) {
      value = cfg[key];
      if (this.cfg.hasOwnProperty(key)) {
        if (this.cfg[key].constructor === Object && value.constructor === Object) {
          jsonHelper.update(this.cfg[key], value);
        } else {
          this.cfg[key] = value;
        }
      }
    }
    delete this.qmp;
    delete this.process;
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name, this.cfg.settings.usbBus);
    vmConf.save(this.cfg);
    return this;
  }

  remove() {
    delete this.qmp;
    delete this.process;
    return vmConf.remove(this.name);
  }

  setStatus(status) {
    this.cfg.status = status;
    return vmConf.save(this.cfg);
  }

  start(cb) {
    this.process.start(this.cfg);
    return this.qmp.connect(this.cfg.settings.qmpPort, (ret) => {
      if (this.cfg.settings.vnc) {
        this.qmp.setVncPass(this.cfg.settings.vnc_password, () => {});
      }
      cb(ret);
      return this.status();
    });
  }

  connectQmp(cb) {
    return this.qmp.connect(this.cfg.settings.qmpPort, (ret) => {
      cb(ret);
      return this.status();
    });
  }

  stopQMP() {
    console.log(`VM ${this.name}: stopQMP called`);
    this.qmp.stopReconnect();
    delete this.qmp;
    return this.qmp = new qmp.Qmp(this.name);
  }

  pause(cb) {
    return this.qmp.pause(cb);
  }

  reset(cb) {
    return this.qmp.reset(cb);
  }

  resume(cb) {
    return this.qmp.resume(cb);
  }

  shutdown(cb) {
    return this.qmp.shutdown(cb);
  }

  stop(cb) {
    return this.qmp.stop(cb);
  }

  status() {
    return this.qmp.status();
  }



  attachHid(cb) {
    if (this.cfg.status === 'stopped') {
      this.cfg.hid = true;
      vmConf.save(this.cfg);
      return cb();
    }
    return this.qmp.attachHid(() => {
      this.cfg.hid = true;
      vmConf.save(this.cfg);
      return cb();
    });
  }

  unattachHid(cb) {
    if (this.cfg.status === 'stopped') {
      this.cfg.hid = false;
      vmConf.save(this.cfg);
      return cb();
    }
    return this.qmp.unattachHid((ret) => {
      this.cfg.hid = false;
      vmConf.save(this.cfg);
      return cb(ret);
    });
  }
}
