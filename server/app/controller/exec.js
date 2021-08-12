'use strict';
const Base = require('../utils/baseClass');
const shell = require('shelljs');
const os = require('os');

class Exec extends Base {
  constructor(props) {
    super(props);
  }

  /**
   * 获取 home 页路径
   * @param ctx
   * @param next
   */
  homeDir(ctx, next) {
    const userInfo = os.userInfo();
    ctx.body = {
      code: 200,
      data: {
        username: userInfo.username,
        homedir: userInfo.homedir || os.homedir()
      }
    }
  }

  /**
   * 执行 shell 命令
   * @param ctx
   * @param next
   */
  async exec(ctx, next) {
    const params = ctx.request.body;
    console.log('路径是: ' + params.path);
    console.log('pwd' + shell.pwd());
    const { code, stdout, stderr, path } = await new Promise((resolve) => {
      shell.cd(params.path);
      const path = shell.pwd(); // cd ${params.path} \n
      shell.exec(`${params.command}`, (code, stdout, stderr) => {
        resolve({ code, stdout, stderr, path: shell.pwd() });
      });
    });

    ctx.body = {
      code: 200,
      data: {
        stdout,
        stderr,
        path
      }
    }
  }
}

module.exports = Exec;
