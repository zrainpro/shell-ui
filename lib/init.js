const chalk = require('chalk');
const symbols = require('log-symbols');
const path = require('path');
const initShellUI = require('../server/app/init');
const JSONDB = require('../utils/jsonDB');

module.exports = async (options, cmd) => {
  const status = new JSONDB({
    path: path.resolve(__dirname, '../status.json')
  });
  if (status.get('init.packageInit', false)) {
    console.log(symbols.info, chalk.yellow('已经初始化过了 shell-ui , 您可以安心使用了, 如果遇到问题想重新初始化, 请先运行 shell clear 清除初始化数据在运行 shell init 来初始化'));
  } else {
    await initShellUI();
    console.log(symbols.success, chalk.green('初始化成功! 现在您可以运行 shell start 来只用 shell-ui 了'));
  }
}
