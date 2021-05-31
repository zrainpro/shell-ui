const chalk = require('chalk');
const symbols = require('log-symbols');
const fs = require('fs');
const pathm = require('path');
const utils = require('../server/app/utils/index');
const Base = require('../server/app/utils/baseClass');
const { createStr } = require('./utils');

module.exports = async (options, cmd) => {
  const [path] = cmd.args;
  // 导入文件路径必填
  if (!path) {
    console.log(symbols.error, chalk.red('请填写导入的文件路径!'));
    return
  }
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
  console.log(symbols.success, chalk.green(`导入成功 ${result.success} 条数据, 导入失败 ${result.fail} 条数据;`));
  // 生成失败条目的表格
  if (result.failData && result.failData.length) {
    let str = chalk.bgBlue('指令名') + createStr(37) + chalk.bgRed('错误信息') + '\n';
    const commandLength = 40; // 指令名占 40 个字符宽度
    result.failData.forEach(item => {
      str += chalk.yellow(item.command);
      str += createStr(commandLength - item.command.length);
      str += chalk.red(item.error) + '\n';
    });
    console.log(str);
  }
}
