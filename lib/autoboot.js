const Vm = require('../models/vm');
const runningMachines = require('./runningMachines');
const bus = require('./bus');

module.exports = async () => {
  const vms = await Vm.where({ auto_boot: true })
    .orderBy('created_at')
    .fetchPage({ pageSize: 10, page: 0 });

  const failedBoot = [];

  for(let vm of vms) {
    try {
      await runningMachines.start(vm);
    } catch (err) {
      failedBoot.push(vm.get('name'));
    }
  }

  bus.emit('toAll', 'updateMachineList', `${failedBoot.slice(0, 2).join(', ')} fail to boot.`);
};
