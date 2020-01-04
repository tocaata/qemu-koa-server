const proc = require('./process');
const qmp = require('./qmp');
const { Vm } = require('../models/vm');
const Gen = require('./generator');
const bus = require('../lib/bus');
const {broadcast} = require('../lib/socket');


class Machine {
  constructor(vmId, VmModel, container) {
    this.model = VmModel;
    this.id = this.model.id;
    this.name = this.model.get('name') + '-' + this.id;
    this.process = new proc.Process({}, {
      error: ({ message }) => {
        console.log('process error');
        this.vmStatus = 'stopped';
        if (this.container != null) {
          this.container.unlink(this.id);
        }
        this.qmp.stopReconnect();
        Gen.releaseQmpPort(this.settings.qmpPort);

        broadcast('updateMachineList', { message });
        console.log('process error');
      },
      exit: ({ message }) => {
        this.vmStatus = 'stopped';
        if (this.container != null) {
          this.container.unlink(this.id);
        }
        this.qmp.stopReconnect();
        Gen.releaseQmpPort(this.settings.qmpPort);

        broadcast('updateMachineList', { message });
        console.log(`${ this.name } process exit`);
      }
    });

    this.vmStatus = 'stopped';
    this.container = container;

    this.eventHandlers = {
      SHUTDOWN: () => {
        console.info(`SHUTDOWN event of ${ this.name } is caught.`);
        broadcast('showMessage', { message: `Virtual machine ${this.name} is shutdown.` });
        // this.vmStatus = 'stopped';
        // broadcast('updateMachineList', { message: 'Virtual machine is shutdown.' });
      },
      POWERDOWN: (data) => {
        console.info(`POWERDOWN event of ${ this.name } is caught.`);
        broadcast('showMessage', { message: `Virtual machine ${this.name} is powerdown.` });
        // this.vmStatus = 'stopped';
        // broadcast('updateMachineList', { message: 'Virtual machine is powerdown.' });
      },
      STOP: () => {
      },
      START: () => {
        console.info(`START event of ${ this.name } is caught.`);
        this.vmStatus = 'running';
      },
      RESUME: () => {
        console.info(`RESUME event of ${ this.name } is caught.`);
        this.vmStatus = 'running';
      },
      RESET: () => {
        this.vmStatus = 'running';
        broadcast('showMessage', { message: `Virtual machine ${this.name} is reset.` });
      },
      SUSPEND: () => {
        this.vmStatus = 'suspended';
        broadcast('updateMachineList', {});
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
    if (this.vmStatus !== 'stopped') {
      throw new Error("Can not start the running virtual machine again!");
    }
    const args = await this.getCmd();
    args.push(['-qmp', `tcp:127.0.0.1:${ this.settings.qmpPort },server`]);
    const proc = this.process.start(args.map(x => {
      if (!x[1]) {
        x.splice(1, 1);
      }
      return x;
    }));

    if (proc && proc.pid) {
      this.connectQmp();
      return true;
    } else {
      throw new Error("Failed to start virtual machine.");
    }
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
      broadcast('updateMachineList', {});
    });
  }

  stopQMP() {
    console.log(`VM ${this.name}: stopQMP called`);
    this.qmp.stopReconnect();
    delete this.qmp;
    return this.qmp = new qmp.Qmp(this.name);
  }

  async sendCmd(cmd, args) {
    if (this.vmStatus === 'stopped') {
      throw new Error('Cannot handle qmp command for stopped virtual machine.');
    }

    return this.qmp.sendCmd(cmd, args);
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
}

module.exports = Machine;
