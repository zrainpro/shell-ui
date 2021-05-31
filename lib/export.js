const chalk = require('chalk');
const symbols = require('log-symbols');
const utils = require('../server/app/utils/index');
const Base = require('../server/app/utils/baseClass');
const { createStr } = require('./utils');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

module.exports = async (options = {}, cmd = {}) => {
  const [paths = './'] = cmd.args; // 导出文件默认当前路径
  const { name = 'shell-ui_database.json' } = options;
  // 先判断路径是否是文件夹, 不允许输入非文件夹路径
  if (!fs.existsSync(paths)) {
    console.log(symbols.error, chalk.red('您输入的路径不存在呢!'));
    return
  }
  new Promise((resolve, reject) => {
    // 先判断路径下是否存在文件, 如果存在文件提示用户是否覆盖
    if (fs.existsSync(path.resolve(paths, name))) {
      inquirer.prompt([
        {
          name: 'isForce',
          type: 'confirm',
          message: `文件 ${path.resolve(paths, name)} 已经存在, 是否覆盖?`
        },
      ]).then(answer => {
        if (answer.isForce) {
          resolve();
        }
      })
    } else {
      resolve();
    }
  }).then(() => {
    // 获取要导出的数据, 命令行导出只支持全部的导出, 不支持部分导出
    const _this = new Base();
    const shellData = _this.json.get('shell');
    const exportData = Object.entries(shellData).map(([key, value]) => value);
    // 导出到指定目录
    fs.writeFileSync(path.resolve(paths, name), JSON.stringify(exportData, null, 2));
    console.log(symbols.success, chalk.green('导出数据成功!'));
  })
}
