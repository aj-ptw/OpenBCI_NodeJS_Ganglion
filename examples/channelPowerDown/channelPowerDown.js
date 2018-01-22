const Ganglion = require('../../openBCIGanglion');
const k = require('openbci-utilities').Constants;
const verbose = true;
let ganglion = new Ganglion({
  debug: true,
  sendCounts: true,
  verbose: verbose
}, (error) => {
  if (error) {
    console.log(error);
  } else {
    if (verbose) {
      console.log('Ganglion initialize completed');
    }
  }
});

function errorFunc (err) {
  throw err;
}

const impedance = false;
const accel = false;

ganglion.once(k.OBCIEmitterGanglionFound, (peripheral) => {
  ganglion.searchStop().catch(errorFunc);

  ganglion.on('sample', (sample) => {
    /** Work with sample */
    console.log(sample.sampleNumber);
  });

  ganglion.on('close', () => {
    console.log('close event');
  });

  ganglion.on('droppedPacket', (data) => {
    console.log('droppedPacket:', data);
  });

  ganglion.on('message', (message) => {
    console.log('message: ', message.toString());
  });


  ganglion.once('ready', () => {
    ganglion.channelOff(4).catch(errorFunc);
    ganglion.streamStart().catch(errorFunc);
    console.log('ready');
  });

  ganglion.connect(peripheral).catch(errorFunc);
});

function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean');
    // console.log(connectedPeripheral)
    ganglion.manualDisconnect = true;
    ganglion.disconnect();
    ganglion.removeAllListeners('droppedPacket');
    ganglion.removeAllListeners('accelerometer');
    ganglion.removeAllListeners('sample');
    ganglion.removeAllListeners('message');
    ganglion.removeAllListeners('impedance');
    ganglion.removeAllListeners('close');
    ganglion.removeAllListeners('error');
    ganglion.removeAllListeners('ganglionFound');
    ganglion.removeAllListeners('ready');
    ganglion.destroyNoble();
  }
  if (err) console.log(err.stack);
  if (options.exit) {
    if (verbose) console.log('exit');
    if (impedance) {
      ganglion.impedanceStop().catch(console.log);
    }
    if (ganglion.isSearching()) {
      ganglion.searchStop().catch(console.log);
    }
    if (accel) {
      ganglion.accelStop().catch(console.log);
    }
    ganglion.manualDisconnect = true;
    ganglion.disconnect(true).catch(console.log);
    process.exit(0);
  }
}

if (process.platform === 'win32') {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));
