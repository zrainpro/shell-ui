const route = require('koa-route');
const os = require('os');
const path = require('path');
const shell = require('shelljs');
const fs = require('../../../utils/fs');
const createUUID = require('../../../utils/createUUID');

const links = {};

module.exports = function (app) {
  app.ws.use(route.all('/terminal', (ctx) => {
    // the websocket is added to the context as `ctx.websocket`.
    
    const sendMessage = (params) => {
      if (typeof params ==='string') {
        ctx.websocket.send(params);
      } else {
        ctx.websocket.send(JSON.stringify({ ...params, currentPath: shell.pwd() }));
      }
    };

    // 首先将用户与根目录信息传送回去
    const userInfo = os.userInfo();
    sendMessage(JSON.stringify({
      username: userInfo.username,
      homedir: userInfo.homedir || os.homedir(),
      uuid: createUUID()
    }));

    ctx.websocket.on('message', async function(originMessage) {
      const message = typeof originMessage ==='string'? originMessage : originMessage.toString();
      if (message === 'hello shell-ui') {
        sendMessage('hello shell-ui-serve');
        return
      }

      const params = JSON.parse(message);

      if (!params.uuid) {
        return sendMessage('error: uuid is required!');
      }

      // 一个客户端只允许起最多一个进程
      if (links[params.uuid]) {
        if (new RegExp('^exit').test(params.command)) {
          links[params.uuid].kill();
          delete links[params.uuid];
          sendMessage({ stdout: '进程结束成功!', stderr: '' });
        } else {
          links[params.uuid].stdin.write(params.command);
        }
        // sendMessage(JSON.stringify({ stdout: params.command, stderr: '', running: true }));
        // sendMessage(JSON.stringify({ stdout: '如果想退出脚本执行其他脚本请先输入 exit 哦', stderr: '', running: true }));
      } else if (params.type === 'command_save') {
        const value = params.command.value;
        const pathDetail = params.command.path;
        fs.writeFileSync(path.resolve(params.path, pathDetail), value);
        sendMessage({
          stdout: '\n保存成功',
          stderr: '',
          running: false
        });
      } else if (params.type === 'tab') {
        // 处理 tab 补全
        shell.cd(params.path);
        const ls = shell.ls('-A');
        const list = ls.filter(_ => _.startsWith(params.command));
        sendMessage({ data: list });
      } else {
        shell.cd(params.path);
        // 对 cd 命令做特殊处理
        if (params.command.startsWith('cd')) {
          // 暂时开启 shell.config.fatal 捕获错误内容
          shell.config.fatal = true;
          try {
            const cmd = params.command.replace('cd', '').replace('~', process.env.HOME).trim();
            shell.cd(cmd);
            sendMessage({ stdout: shell.pwd(), stderr: '', running: false });
          } catch (e) {
            sendMessage({ stdout: '', stderr: e.message, running: false });
          }
          // 关闭 shell.config.fatal
          shell.config.fatal = false;
        } else {
          const child = shell.exec(`${params.command}`, {
            silent: true
          }, (code, stdout, stderr) => {
            // 出错的时候调用这个
            if (stderr) {
              sendMessage({ stdout, stderr, running: false });
            } else {
              sendMessage({ stdout: '', stderr: '', running: false });
            }
            delete links[params.uuid];
            child.kill();
          });
          child.stdout.on('data', function(data) {
            // 正常数据返回走这个
            sendMessage({
              stdout: data,
              stderr: '',
              running: true
            });
          });
          links[params.uuid] = child;
        }
      }
    });
  }));
}