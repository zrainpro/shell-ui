const chalk = require('chalk');
const symbols = require('log-symbols');
const support = require('../utils/supportType');
const utils = require('../server/app/utils/index');
const Base = require('../server/app/utils/baseClass');

module.exports = async (options, cmd) => {
  let { parent = 'root', children = '', name = '', alias, description = '', type = 'shell' } = options;
  let [command, ...shell] = cmd.args;
  // 指令名必填
  if (!command) {
    console.log(symbols.error, chalk.red('指令名是必填的!'));
    throw new Error('指令名是必填的');
  }
  if (!shell.length) {
    console.log(symbols.error, chalk.red('指令内容是必填的!'));
    throw new Error('指令内容是必填的');
  }
  // 校验传入的 type 是否正确
  if (!support.find(item => item.value === type)) {
    console.log(symbols.warning, `不支持的脚本类型 ${type}, 强制替换为 shell 脚本`);
    type = 'shell'; // 不支持的类型默认设置成 shell
  }
  // 先找到旧指令
  const _this = new Base();
  // 找到要修改的指令 - 重新赋值相关关系, 有 children 表明 parent 是 command, 这里的 parent 只表示要修改的数据
  const oldCommand = await utils.getInstructFromName({ _this, params: children ? { parent: command, command: children } : { parent: 'root', command } });
  if (oldCommand.error) {
    console.log(symbols.error, chalk.red(oldCommand.error));
    throw new Error(oldCommand.error);
  }
  // 修改指令
  const result = await utils.editInstruct({
    _this,
    params: {
      ...oldCommand,
      oldParent: !oldCommand.parent || oldCommand.parent === 'root' ? '' : oldCommand.parent,
      parent,
      command: name || (children ? children : command), // name 最高优先级因为指定的, 没有 name 根据 children 判断修改的指令是哪个, 传入规则是 command 固定根指令, children 固定子指令
      alias,
      type,
      description,
      shell: shell.join(' ')
    }
  });
  if (result.error) {
    console.log(symbols.error, chalk.red(result.error));
    throw new Error(result.error);
  }
  console.log(symbols.success, chalk.green(`修改指令 ${command} 成功!`));
}
