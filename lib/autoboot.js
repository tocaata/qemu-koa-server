const Vm = require('../models/vm');
const runningMachines = require('./runningMachines');
const {broadcast} = require('./socket');

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

  broadcast('updateMachineList', { message:  `${failedBoot.slice(0, 2).join(', ')} fail to boot.`});
};
