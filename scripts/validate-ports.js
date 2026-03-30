// Simple port validation script
const ports = [3000, 3001, 5432, 6379];

ports.forEach(port => {
  try {
    const net = require('net');
    const server = net.createServer();
    server.listen(port, () => {
      console.log(`Port ${port} is available`);
      server.close();
    });
    server.on('error', () => {
      console.log(`Port ${port} is in use`);
    });
  } catch (e) {
    console.log(`Port ${port} check failed: ${e.message}`);
  }
});
