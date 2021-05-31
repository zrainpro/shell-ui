const chalk = require('chalk');
const symbols = require('log-symbols');
const Base = require('../server/app/utils/baseClass');
const { createStr } = require('./utils');

module.exports = async (options, cmd) => {
  const { all } = options;
  const [rootShell] = cmd.args; // 导出文件默认当前路径
  const _this = new Base();
  const shellData = _this.json.get('shell');
  let lsData = [];
  if (rootShell) {
    if (!shellData[rootShell]) {
      console.log(symbols.info, chalk.yellow(`指令 ${rootShell} 不存在`));
      return
    }
    lsData = shellData[rootShell].children.filter(item => all || item.enable);
  } else {
    lsData = Object.entries(shellData).map(([key, value]) => value).filter(item => all || item.enable);
  }

  // 表格展示的数据  指令名 35 启用(加 all 的加上这一列, 6) 简写 16 类型 14 描述
  let str = chalk.bgBlue('指令名') + createStr(24) + (all ? (chalk.bgYellow(chalk.black('状态')) + createStr(2)) : '') + chalk.bgGreen(chalk.black('简写')) + createStr(12) + chalk.bgWhite('类型') + createStr(10) + chalk.bgCyan('描述') + '\n';
  lsData.forEach(item => {
    str += chalk.blue(item.command) + createStr(30 - item.command.length);
    all && (str += chalk.yellow(item.enable ? '启用' : '禁用') + createStr(2));
    str += chalk.green(item.alias) + createStr(16 - item.alias.length);
    str += chalk.white(item.type) + createStr(14 - item.type.length);
    str += chalk.cyan(item.description) + '\n';
  });
  console.log(str);
}
