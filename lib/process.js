const Proc = require('child_process');
const OS = require('os');
const pinMask = Array.from({length: OS.cpus().length}).fill(0);

class Process {

  constructor(props) {
    this.proc = undefined;
    this.bin = 'qemu-system-x86_64';
    this.occupy = [];
  }

  start(conf) {
    try {
      this.proc = Proc.spawn(this.bin, conf, { stdio: 'inherit', detached: true });

      console.log(`QEMU-Process: Start-Parameters: ${conf.join(' ')}`);

      this.pin(this.proc.pid);

      this.proc.on('exit', (code, signal) => {
        if (code === 0) {
          console.log("QEMU-Process: exit clean.");
        } else {
          console.error(`QEMU-Process: exit with error: #{code}, signal: ${signal}`);
        }
      })
    } catch (e) {
      console.error("process:start:e");
      console.dir(e);
    }
  }

  pin(threadCount) {
    this.occupy = Object.entries(pinMask)
      .filter(([i, v]) => v === 0)
      .map(([i, v]) => i).slice(0, threadCount);

    if (this.occupy.length > 0) {
      Proc.exec(`task -cp ${ this.occupy.join(',') } ${ this.proc.pid }`, { maxBuffer: 10 * 1024 }, (e, stdout, stderr) => {
        if (e) {
          this.occupy = [];
          console.dir(e);
        } else {
          console.log(`taskset for pid ${ this.proc.pid } with cpulist ${ this.occupy.join(',') } executed`);
        }
      });
    }
  }
}

module.exports = { Process };
