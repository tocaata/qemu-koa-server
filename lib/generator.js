const PORT_BEGIN = 15000;
const QmpPorts = Array.from({length: 100}).fill(false);



module.exports = {
  getQmpPort() {
    const i = QmpPorts.indexOf(false);
    QmpPorts[i] = true;
    return PORT_BEGIN + i;
  },

  releaseQmpPort(port) {
    QmpPorts[port - PORT_BEGIN] = false;
  }
};
