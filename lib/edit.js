const chalk = require('chalk');
const symbols = require('log-symbols');
const support = require('../utils/supportType');
const utils = require('../server/app/utils/index');
const Base = require('../server/app/utils/baseClass');

module.exports = async (options, cmd) => {
  let { parent = '', children = '', name = '', alias, description, type = '' } = options;
  let [command, ...shell] = cmd.args;
  // 指令名必填
  if (!command) {
    console.log(symbols.error, chalk.red('指令名是必填的!'));
    return
  }
  // 校验传入的 type 是否正确
  if (type && !support.find(item => item.value === type)) {
    console.log(symbols.warning, `不支持的脚本类型 ${type}, 强制替换为 shell 脚本`);
    type = 'shell'; // 不支持的类型默认设置成 shell
  }
  // 先找到旧指令
  const _this = new Base();
  // 找到要修改的指令 - 重新赋值相关关系, 有 children 表明 parent 是 command, 这里的 parent 只表示要修改的数据
  const oldCommand = await utils.getInstructFromName({ _this, params: children ? { parent: command, command: children } : { parent: 'root', command } });
  if (oldCommand.error) {
    console.log(symbols.error, chalk.red(oldCommand.error));
    return
  }
  // 修改指令
  const result = await utils.editInstruct({
    _this,
    params: {
      ...oldCommand.command,
      oldParent: !oldCommand.command.parent || oldCommand.command.parent === 'root' ? '' : oldCommand.command.parent,
      parent: parent || oldCommand.command.parent || 'root',
      command: name || (children ? children : command), // name 最高优先级因为指定的, 没有 name 根据 children 判断修改的指令是哪个, 传入规则是 command 固定根指令, children 固定子指令
      alias: alias === undefined ? oldCommand.command.alias : alias, // 可以设置为空
      type: type || oldCommand.command.type,
      description: description === undefined ? oldCommand.command.description : description, // 可以设置为空
      shell: !shell.length ? oldCommand.command.shell : shell.join(' ')
    }
  });
  if (result.error) {
    console.log(symbols.error, chalk.red(result.error));
    return
  }
  console.log(symbols.success, chalk.green(`修改指令 ${children || command} 成功!`));
}
