'use strict';
const net = require('net');

// 启动 APP
module.exports = function runApp (port, app) {
  // 创建服务并监听该端口
  const server = net.createServer().listen(port)
  server.on('listening', function () {
    server.close() // 关闭服务
    app.listen(port);
    console.log('app listen on: ');
    console.log(`http://localhost:${port}`);
  })
  server.on('error', function (err) {
    if (err.code === 'EADDRINUSE') { // 端口已经被使用
      runApp(port + 1, app);
    }
  })
}
