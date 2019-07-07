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
      // Add '-' to all command options
      // Flatten args array. etc. [['-smp', '2,thread=1'], ['-rtc', 'base=localtime']] to ['-smp', '2,thread=1', '-rtc', 'base=localtime']
      const args = Array.prototype.concat.apply([], conf);
      this.proc = Proc.spawn(this.bin, args, { stdio: 'inherit', detached: true });
      console.log(`QEMU-Process: Start-Parameters: ${ args.join(' ') }`);

      let smp = conf.find(x => x[0] === '-smp');
      const mth = smp && smp[1] && smp[1].match(/(cores=)?(\d)+/);
      const threadCount = mth[2];
      this.pin(threadCount);

      this.proc.on('exit', (code, signal) => {
        this.unpin();
        console.log(pinMask);
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
      Proc.exec(`taskset -cp ${ this.occupy.join(',') } ${ this.proc.pid }`, { maxBuffer: 10 * 1024 }, (e, stdout, stderr) => {
        if (e) {
          this.occupy = [];
          console.dir(e);
        } else {
          console.log(`taskset for pid ${ this.proc.pid } with cpulist ${ this.occupy.join(',') } executed`);
        }
      });
    }
  }

  unpin() {
    this.occupy.forEach(x => {
      pinMask[x] = 0;
    });
    this.occupy = [];
  }
}

module.exports = { Process };
