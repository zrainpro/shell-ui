const chalk = require('chalk');
const symbols = require('log-symbols');
const fs = require('fs');
const pathm = require('path');
const utils = require('../server/app/utils/index');
const Base = require('../server/app/utils/baseClass');
const { createStr } = require('./utils');

module.exports = async (options, cmd) => {
  const [path = './shell-ui_database.json'] = cmd.args;
  // 判断文件是否存在
  if (!fs.existsSync(pathm.resolve(path))) {
    console.log(symbols.error, `文件 ${pathm.resolve(path)} 不存在!请确认文件路径是否正确`);
    return
  }
  let json = [];
  try {
    if ((/.json$/g).test(path)) {
      json = require(pathm.resolve(path));
      if (!Array.isArray(json)) {
        console.log(symbols.error, chalk.red('导入文件数据格式不对!'));
        return
      }
    } else {
      console.log(symbols.error, chalk.red(`只支持导入 json 文件!`));
      return
    }
  } catch (e) {
    console.log(e);
    console.log(symbols.error, chalk.red(`解析文件时发生错误,请确定导入的文件是正确的!`));
    return
  }
  const _this = new Base();

  const result = await utils.importInstruct({
    _this,
    json
  });
  console.log(symbols.success, chalk.green(`成功导入根指令 ${result.successRoot} 条\n 忽略根指令 ${result.ignoreRoot} 条, 忽略子指令 ${result.ignoreChild} 条\n 导入失败根指令 ${result.failRoot} 条, 导入失败子指令 ${result.failChild} 条`));
  const commandLength = 20; // 指令名占 40 个字符宽度
  const aliasLength = 15; // 指令简写占 25 个字符宽度
  // 生成忽略的指令的表格
  const ignoreData = [ ...(result.ignoreRootData || []), ...(result.ignoreChildData || []) ];
  if (ignoreData.length) {
    let str = chalk.bgMagenta('忽略条目:\n\n') + chalk.bgCyan('父指令名') + createStr(12) + chalk.bgBlue('指令名') + createStr(14) + chalk.bgGreen('指令简写\n');
    ignoreData.forEach(item => {
      str += chalk.cyan(item.parentCommand || '');
      str += createStr(commandLength - (item.parentCommand || '').length);
      str += chalk.blue(item.command);
      str += createStr(commandLength - item.command.length);
      str += chalk.green(item.alias || '') + '\n';
    });
    console.log(str);
  }
  // 生成失败条目的表格
  const failData = [ ...(result.failRootData || []), ...(result.failChildData || []) ];
  if (failData.length) {
    let str = chalk.bgMagenta('导入失败条目:\n\n') + chalk.bgCyan('父指令名') + createStr(12) + chalk.bgBlue('指令名') + createStr(14) + chalk.bgGreen('指令简写') + createStr(7) + chalk.bgRed('错误信息') + '\n';
    failData.forEach(item => {
      str += chalk.cyan(item.parentCommand || '');
      str += createStr(commandLength - (item.parentCommand || '').length);
      str += chalk.blue(item.command);
      str += createStr(commandLength - item.command.length);
      str += chalk.green(item.alias || '');
      str += createStr(aliasLength - (item.alias || '').length);
      str += chalk.red(item.error) + '\n';
    });
    console.log(str);
  }
}
