const proc = require('./process');
const qmp = require('./qmp');
const { Vm } = require('../models/vm');
const Gen = require('./generator');
const bus = require('../lib/bus');


class Machine {
  constructor(vmId, VmModel, container) {
    this.model = VmModel;
    this.id = this.model.id;
    this.name = this.model.get('name') + '-' + this.id;
    this.process = new proc.Process();

    this.vmStatus = 'stopped';
    this.container = container;

    this.eventHandlers = {
      SHUTDOWN: () => {
        console.log('shutdown is called');
        this.vmStatus = 'stopped';
        if (this.container != null) {
          this.container.unlink(this.id);
        }
        Gen.releaseQmpPort(this.settings.qmpPort);
        bus.emit('toAll', 'updateMachineList', {});
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
    };

    this.qmp = new qmp.Qmp(this.name, this.eventHandlers);
    this.settings = {
      qmpPort: Gen.getQmpPort()
    };
  }

  edit(cfg) {
    this.model.update(cfg);
    delete this.qmp;
    delete this.process;
    this.process = new proc.Process();
    this.qmp = new qmp.Qmp(this.name, this.eventHandlers);

    return this;
  }

  async delete() {
    delete this.qmp;
    delete this.process;
    return this.model.delete();
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
    return this.qmp.connect(this.settings.qmpPort).then(x => {
      this.vmStatus = "running";
      bus.emit('toAll', 'updateMachineList', {});
    });
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
}

module.exports = Machine;
