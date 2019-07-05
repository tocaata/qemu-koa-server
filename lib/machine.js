const proc = require('./process');
const qmp = require('./qmp');
const { Vm } = require('../models/vm');
const Gen = require('./generator');


class Machine {
  constructor(vmId, VmModel) {
    this.model = VmModel;
    this.id = this.model.id;
    this.name = this.model.get('name') + '-' + require('crypto').randomBytes(16).toString('hex');
    this.process = new proc.Process();

    this.qmp = new qmp.Qmp(this.name, {
      SHUTDOWN: () => {
        this.vmStatus = 'stopped';
      },
      START: () => {
        this.vmStatus = 'running';
      },
      RESUME: () => {
        this.vmStatus = 'running';
      },
      RESET: () => {
        this.vmStatus = 'running';
      }
    });
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

  async delete() {
    delete this.qmp;
    delete this.process;
    return this.model.delete();
  }


  // @outdated
  async setStatus(status) {
    let result = await this.model.update({ status });
    this.cfg.status = status;
    return vmConf.save(this.cfg);
  }

  async start() {
    const args = await this.getCmd();
    args.push(['-qmp', `tcp:127.0.0.1:${ this.settings.qmpPort },server`]);
    const ret = this.process.start(args.map(x => {
      if (!x[1]) {
        x.splice(1, 1);
      }
      return x;
    }));
    this.connectQmp();
    return ret;
  }

  async getCmd() {
    let ret = [];
    ret.push(['-name', this.name]);
    ret = ret.concat(await this.model.getCmd());
    return ret;
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

  handleStart(vm) {
    console.log("vmHandler Extension received START event");
    vm.setStatus('running');
    socketServer.toAll('set-vm-status', vm.name, 'running');
    socketServer.toAll('msg', {
      type: 'success',
      msg: "VM " + vm.name + " start."
    });
    if (vm.cfg.hid) {
      return vm.attachHid(function() {
        return socketServer.toAll('update-vm', curVm.cfg);
      });
    }
  };


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
