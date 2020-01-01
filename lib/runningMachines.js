const Machine = require('./machine');

class RunningMachine {
  constructor() {
    console.log('new RunningMachine');
    this.runningMachines = [];
  }

  unlink(id) {
    let index = this.runningMachines.findIndex(x => x.id === id);
    if (index >= 0) {
      delete this.runningMachines[index];
      this.runningMachines.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  async start(machine) {
    if (typeof(machine) !== 'object') {
      throw new Error("Argument machine must be a bookshelf model.");
    } else {
      let i;
      if ((i = this.runningMachines.indexOf(m => m.id === machine.id)) > 0) {
        return this.runningMachines[i].start();
      } else {
        const m = new Machine(machine.id, machine, this);
        let ret = await m.start();
        this.runningMachines.push(m);
        return ret;
      }
    }
  }

  async stop(machine) {
    if (typeof machine !== 'object') {
      throw new Error("function argument machine must be a bookshelf model.");
    } else {
      let i;
      if ((i = this.runningMachines.indexOf(m => m.id === machine.id)) > 0) {
        return this.runningMachines[i].shutdown();
      } else {
        throw new Error("Machine is not running, can not stop!");
      }
    }
  }

  async delete(machine) {
    if (typeof machine !== 'object') {
      throw new Error("function argument machine must be a bookshelf model.");
    } else {
      let i;
      if ((i = this.runningMachines.indexOf(m => m.id === machine.id)) > 0) {
        throw new Error("Machine is running, can not be deleted!");
      } else {
        const m = new Machine(machine.id, machine);
        return m.delete();
      }
    }
  }

  async exec(machine, method, args) {
    if (typeof machine !== 'object') {
      throw new Error("function argument machine must be a bookshelf model.");
    } else {
      let i;
      if ((i = this.runningMachines.findIndex(m => m.id === machine.id)) >= 0) {
        if (typeof this.runningMachines[i][method] === 'function') {
          return this.runningMachines[i][method](args);
        } else {
          return this.runningMachines[i]['sendCmd'](method, args);
        }
      } else {
        const m = new Machine(machine.id, machine);
        if (typeof m[method] === 'function') {
          return m[method](args);
        } else {
          return m['sendCmd'](method, args);
        }
      }
    }
  }
}

module.exports = new RunningMachine();
