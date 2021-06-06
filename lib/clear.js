const chalk = require('chalk');
const symbols = require('log-symbols');
const Base = require('../server/app/utils/baseClass');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const exportData = require('./export');
const windowUnInstall = require('../server/app/utils/windowuninstall');

module.exports = async (options, cmd) => {
  inquirer.prompt([
    {
      name: 'clear',
      type: 'confirm',
      message: `清空操作不能恢复, 确认清空嘛?`
    },
    {
      name: 'export',
      type: 'confirm',
      message: '是否在清空之前备份当前指令呢?'
    }
  ]).then(async answer => {
    if (!answer.clear) return
    if (answer.export) {
      await exportData({}, { args: [] });
    }
    // 先清除 packageJSON 的数据
    const _this = new Base();
    const pkg = new _this.JSONDB({ path: path.resolve(__dirname, '../package.json') });
    const shellData = new _this.JSONDB({ path: path.resolve(__dirname, '../../shell-ui-database/json/shell.json') })
    // 清除软链接
    Object.keys(pkg.get('bin')).forEach(key => {
      const command = shellData.get(`shell.${key}`);
      if (command) {
        if (process.platform === 'win32') {
          windowUnInstall(command);
        } else {
          ([command.command, command.alias]).forEach(cmd => {
            if (!cmd) return;
            // 删除指令数据
            if (shell.which(cmd)) {
              shell.rm('-f', shell.which(cmd).stdout);
              // fs.unlinkSync(shell.which(cmd).stdout);
            }
          });
        }
      }
    })
    pkg.set('bin', {
      shell: './bin/index.js'
    });
    pkg.write().destroy();
    // 然后清除 shell-ui-database 包
    if (fs.existsSync(path.resolve(__dirname, '../../shell-ui-database'))) {
      shell.rm('-r', path.resolve(__dirname, '../../shell-ui-database'));
    }
    // 标记项目没用初始化完成
    const status = new _this.JSONDB({
      path: path.resolve(__dirname, '../status.json')
    });
    status.set('init', {
      packageInit: false
    });
    status.write().destroy();

    console.log(symbols.success, chalk.green('清除数据成功!'))
  });
}
