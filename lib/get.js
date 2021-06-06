const chalk = require('chalk');
const Base = require('../server/app/utils/baseClass');

module.exports = async (options, cmd) => {
  const { parent = '' } = options;
  const [shellName] = cmd.args; // 导出文件默认当前路径

  if (!shellName) {
    console.log(chalk.red(`请输入要获取的指令`));
    return;
  }

  const _this = new Base();
  const shellData = _this.json.get('shell');
  let command = null;
  if (parent) {
    const parentCommand = shellData[parent];
    if (!parentCommand) {
      console.log(chalk.red(`您输入的根指令 ${parent} 不存在!`));
      return;
    }
    command = parentCommand.children.find(item => item.command === shellName);
  } else {
    command = shellData[shellName];
  }
  if (!command) {
    console.log(`您输入的指令 ${shellName} 不存在!`);
    return;
  }
  console.log(chalk.cyan(command.shell));
}
