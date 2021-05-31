const chalk = require('chalk');
const symbols = require('log-symbols');
const utils = require('../server/app/utils/index');
const Base = require('../server/app/utils/baseClass');

module.exports = async (options, cmd) => {
  let { parent = 'root' } = options;
  const [command] = cmd.args;
  // 指令名必填
  if (!command) {
    console.log(symbols.error, chalk.red('指令名是必填的!'));
    throw new Error('指令名是必填的');
  }
  const _this = new Base();
  const params = {
    parent,
    command
  }
  const oldCommand = await utils.getInstructFromName({ _this, params });
  if (oldCommand.error) {
    console.log(symbols.error, chalk.red(oldCommand.error));
    throw new Error(oldCommand.error);
  }
  // 禁用指令
  oldCommand.command = false; // 禁用指令
  const result = await utils.enableInstruct({
    _this,
    params: oldCommand.command
  });
  if (result.error) {
    console.log(symbols.error, chalk.red(result.error));
    throw new Error(result.error);
  }
  console.log(symbols.success, chalk.green(`禁用指令 ${command} 成功!`));
}
