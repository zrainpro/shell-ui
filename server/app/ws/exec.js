const route = require('koa-route');
const os = require('os');
const path = require('path');
const shell = require('shelljs');
const fs = require('fs');
const createUUID = require('../../../utils/createUUID');

const links = {};

module.exports = function (app) {
  app.ws.use(route.all('/terminal', (ctx) => {
    // the websocket is added to the context as `ctx.websocket`.

    // 首先将用户与根目录信息传送回去
    const userInfo = os.userInfo();
    ctx.websocket.send(JSON.stringify({
      username: userInfo.username,
      homedir: userInfo.homedir || os.homedir(),
      uuid: createUUID()
    }));

    ctx.websocket.on('message', async function(message) {
      if (message === 'hello shell-ui') {
        ctx.websocket.send('hello shell-ui-serve');
        return
      }

      const params = JSON.parse(message);

      if (!params.uuid) {
        return ctx.websocket.send('error: uuid is required!');
      }

      // 一个客户端只允许起最多一个进程
      if (links[params.uuid]) {
        if (new RegExp('^exit').test(params.command)) {
          links[params.uuid].kill();
          delete links[params.uuid];
          ctx.websocket.send(JSON.stringify({ stdout: '进程结束成功!', stderr: '' }));
        } else {
          links[params.uuid].stdin.write(params.command);
        }
        // ctx.websocket.send(JSON.stringify({ stdout: params.command, stderr: '', running: true }));
        // ctx.websocket.send(JSON.stringify({ stdout: '如果想退出脚本执行其他脚本请先输入 exit 哦', stderr: '', running: true }));
      } else if (params.type === 'command_save') {
        const value = params.command.value;
        const pathDetail = params.command.path;
        fs.writeFileSync(path.resolve(params.path, pathDetail), value);
        ctx.websocket.send(JSON.stringify({
          stdout: '\n保存成功',
          stderr: '',
          running: false
        }));
      } else if (params.type === 'tab') {
        // 处理 tab 补全
        shell.cd(params.path);
        const ls = shell.ls('-A');
        const list = ls.filter(_ => _.startsWith(params.command));
        ctx.websocket.send(JSON.stringify({ data: list }));
      } else {
        shell.cd(params.path);
        // path: shell.pwd()
        const child = shell.exec(`${params.command}`, {
          silent: true
        }, (code, stdout, stderr) => {
          // 出错的时候调用这个
          if (stderr) {
            ctx.websocket.send(JSON.stringify({ stdout, stderr, running: false }));
          } else {
            ctx.websocket.send(JSON.stringify({ stdout: '', stderr: '', running: false }));
          }
          delete links[params.uuid];
          child.kill();
        });
        child.stdout.on('data', function(data) {
          // 正常数据返回走这个
          ctx.websocket.send(JSON.stringify({
            stdout: data,
            stderr: '',
            running: true
          }));
        });
        links[params.uuid] = child;
      }
    });
  }));
}