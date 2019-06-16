const Machine = require('./machine');

class RuningMachine {
  constructor() {
    this.runingMachines = [];
  }

  async start(machine) {
    if (typeof(machine) !== 'object') {
      throw new Error("Argument machine must be a bookshelf model.");
    } else {
      let i;
      if ((i = this.runingMachines.indexOf(m => m.id === machine.id)) > 0) {
        await this.runingMachines[i].start();
      } else {
        const m = new Machine(machine.id, machine);
        await m.start();
        this.runingMachines.push(m);
      }
    }
  }

  async stop(machine) {
    if (typeof machine !== 'object') {
      throw new Error("function argument machine must be a bookshelf model.");
    } else {
      let i;
      if ((i = this.runingMachines.indexOf(m => m.id === machine.id)) > 0) {
        return await this.runingMachines[i].shutdown();
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
      if ((i = this.runingMachines.indexOf(m => m.id === machine.id)) > 0) {
        throw new Error("Machine is running, can not be deleted!");
      } else {
        const m = new Machine(machine.id, machine);
        return await m.delete();
      }
    }
  }

  async exec(method, machine, ...args) {
    if (typeof machine !== 'object') {
      throw new Error("function argument machine must be a bookshelf model.");
    } else {
      let i;
      if ((i = this.runingMachines.indexOf(m => m.id === machine.id)) > 0) {
        return await this.runingMachines[i][method](args);
      } else {
        const m = new Machine(machine.id, machine);
        return await m[method](args);
      }
    }
  }

}

module.exports = new RuningMachine();
