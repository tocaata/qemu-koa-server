const proc = require('./process');
const qmp = require('./qmp');
const { Vm } = require('../models/vm');
const Gen = require('./generator');


class Machine {
  constructor(vmId, VmModel) {
    this.model = VmModel;
    this.id = this.model.id;
    this.name = this.model.get('name');
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name);
    this.vmStatus = 'stopped';
    this.settings = {
      qmpPort: Gen.getQmpPort()
    };
  }

  edit(cfg) {
    this.model.update(cfg);
    delete this.qmp;
    delete this.process;
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name);

    return this;
  }

  async remove() {
    delete this.qmp;
    delete this.process;
    return this.model.destroy();
  }


  // @outdated
  async setStatus(status) {
    let result = await this.model.update({ status });
    this.cfg.status = status;
    return vmConf.save(this.cfg);
  }

  async start() {
    const args = await this.model.getCmd();
    this.process.start(args);
    return this.qmp.connect(this.settings.qmpPort);
  }

  getCmd() {
    return this.model.getCmd();
  }

  connectQmp() {
    return this.qmp.connect(this.settings.qmpPort);
  }

  stopQMP() {
    console.log(`VM ${this.name}: stopQMP called`);
    this.qmp.stopReconnect();
    delete this.qmp;
    return this.qmp = new qmp.Qmp(this.name);
  }

  pause() {
    return this.qmp.pause();
  }

  reset() {
    return this.qmp.reset();
  }

  resume() {
    return this.qmp.resume();
  }

  shutdown() {
    return this.qmp.shutdown();
  }

  stop() {
    return this.qmp.stop();
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

module.exports = Machine;
