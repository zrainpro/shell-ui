'use strict';
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const JSONDB = require('../../../utils/jsonDB');

// 更新 package.json 文件, 并重新 npm link
function reLoadPackage (command) {
  return new Promise((resolve) => {
    // 引入 package.json
    const packageJson = new JSONDB({
      path: path.resolve(__dirname, '../../../package.json')
    });
    const name = packageJson.get('name');
    packageJson.get('bin')[command.command] = `./lib/userScript/${command.command}.js`;
    packageJson.write();
    packageJson.destroy();
    if (shell.which('shell')) {
      const paths = shell.which('shell').stdout;
      // 链接文件
      const shellPath = paths.replace(/\/shell$/g, `/${command.command}`);
      fs.symlinkSync(path.resolve(__dirname, `../../../lib/userScript/${command.command}.js`), shellPath);
      shell.chmod('777', shellPath); // 程序可执行
      resolve();
    } else {
      return
    }
  })
}
async function buildShell(command) {
  // 读取模板文件
  let template = fs.readFileSync(path.resolve(__dirname, '../../../bin/script.template')).toString();
  // 替换字符串模板
  template = template.replace(/`\{\{command\}\}`/g, command.command);
  template = template.replace(/`'\{\{command\}\}'`/g, `'${command.command}'`);
  // 创建父级 js 脚本
  fs.writeFileSync(path.resolve(__dirname, `../../../lib/userScript/${command.command}.js`), template);
  // 如果父脚本是 shell 类型的, 创建父脚本的 sh 文件
  if (command.type === 'shell') {
    fs.writeFileSync(path.resolve(__dirname, `../../../lib/userShell/${command.command}.sh`), command.shell);
  }
  // 创建子脚本的存放目录
  if (!fs.existsSync(path.resolve(__dirname, `../../../lib/userShell/${command.command}`))) {
    fs.mkdirSync(path.resolve(__dirname, `../../../lib/userShell/${command.command}`));
  }
  // 更新 package 文件重新 npm link
  await reLoadPackage(command)
}
// 删除 package.json 中的指令
function deletePackageShell(command) {
  return new Promise(resolve => {
    // 引入 package.json
    const packageJson = new JSONDB({
      path: path.resolve(__dirname, '../../../package.json')
    });
    // 删除 command 的指令并保存
    packageJson.delete(`bin.${command.command}`).write();
    packageJson.destroy();
    // 删除指令数据
    if (shell.which(command.command)) {
      shell.rm('-f', shell.which(command.command).stdout);
    }
    // 删除创建的 js 文件
    shell.rm('-f', path.resolve(__dirname, `../../../lib/userScript/${command.command}.js`));
    // 如果之前是 shell 类型的, 应该删除掉对应创建的 shell 脚本
    shell.rm('-f', path.resolve(__dirname, `../../../lib/userShell/${command.command}.sh`));
    // 删除之前的 shell 子脚本
    shell.rm('-rf', path.resolve(__dirname, `../../../lib/userShell/${command.command}`));
    resolve()
  })
}

module.exports = {
  reLoadPackage,
  buildShell,
  deletePackageShell
}
