const chalk = require('chalk');
const symbols = require('log-symbols');
const support = require('../utils/supportType');
const utils = require('../server/app/utils/index');
const Base = require('../server/app/utils/baseClass');

module.exports = async (options, cmd) => {
  let { parent = 'root', alias = '', description = '', type = 'shell' } = options;
  const [command, ...shell] = cmd.args;
  // 指令名必填
  if (!command) {
    console.log(symbols.error, chalk.red('指令名是必填的!'));
    return;
  }
  if (!shell.length) {
    console.log(symbols.error, chalk.red('指令内容是必填的!'));
    return
  }
  // 校验传入的 type 是否正确
  if (!support.find(item => item.value === type)) {
    console.log(symbols.warning, `不支持的脚本类型 ${type}, 强制替换为 shell 脚本`);
    type = 'shell'; // 不支持的类型默认设置成 shell
  }
  const _this = new Base();
  const params = {
    parent,
    command,
    alias,
    type,
    description,
    shell: shell.join(' ')
  }
  const result = await utils.createInstruct({
    _this,
    params
  });
  if (result.error) {
    console.log(symbols.error, chalk.red(result.error));
    return
  }
  console.log(symbols.success, chalk.green(`创建指令 ${command} 成功!`));
}
