const proc = require('./process');
const qmp = require('./qmp');
const { Vm } = require('../models/vm');


class Machine {
  constructor(vmId, VmModel) {
    this.model = VmModel;
    this.id = this.model.id;
    this.name = this.model.get('name');
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name);
  }

  edit(cfg) {
    this.model.update(cfg);
    delete this.qmp;
    delete this.process;
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name);

    return this;
  }

  remove() {
    delete this.qmp;
    delete this.process;
    return this.model.delete();
  }

  setStatus(status) {
    this.cfg.status = status;
    return vmConf.save(this.cfg);
  }

  async start() {
    const args = await this.model.getCmd();
    this.process.start(args);
    return new Promise((resolve, reject) => {
      this.qmp.connect(this.model.get('qmpPort')).then(ret => {
        resolve(ret);
        return this.status();
      });
    });
  }

  connectQmp() {
    return new Promise((resolve, reject) => {
      this.qmp.connect(this.cfg.settings.qmpPort, (ret) => {
        resolve(ret);
        return this.status();
      });
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
