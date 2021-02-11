'use strict';
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const JSONDB = require('../../../utils/jsonDB');

const fileType = {
  shell: 'sh',
  javascript: 'js', // 不需要
  java: 'java',
  python: 'py',
  go: 'go'
}

// 更新 package.json 文件, 并重新 npm link
function reLoadPackage (command) {
  return new Promise((resolve) => {
    // 引入 package.json
    const packageJson = new JSONDB({
      path: path.resolve(__dirname, '../../../package.json')
    });
    const name = packageJson.get('name');
    packageJson.get('bin')[command.command] = `../shell-ui-database/lib/userScript/${command.command}.js`;
    packageJson.write();
    packageJson.destroy();
    if (shell.which('shell')) {
      const paths = shell.which('shell').stdout;
      // 链接文件
      const shellPath = paths.replace(/\/shell$/g, `/${command.command}`);
      // 如果之前存在软链接, 需要删除软链接防止创建软链接失败
      if (fs.existsSync(shellPath) && fs.lstatSync(shellPath).isSymbolicLink(shellPath)) {
        shell.rm('-r', shellPath);
      }
      fs.symlinkSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userScript/${command.command}.js`), shellPath);
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
  fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userScript/${command.command}.js`), template);
  // 如果父脚本是 shell 类型的, 创建父脚本的 sh 文件
  if (command.type !== 'javascript' && fileType[command.type]) {
    fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.command}.${fileType[command.type]}`), command.shell);
  }
  // 创建子脚本的存放目录
  if (!fs.existsSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.command}`))) {
    fs.mkdirSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.command}`));
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
    shell.rm('-f', path.resolve(__dirname, `../../../../shell-ui-database/lib/userScript/${command.command}.js`));
    // 如果之前是 shell 类型的, 应该删除掉对应创建的 shell 脚本
    if (command.type !== 'javascript' && fileType[command.type]) {
      shell.rm('-f', path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.command}.${fileType[command.type]}`));
    }
    // 删除之前的 shell 子脚本
    shell.rm('-rf', path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.command}`));
    resolve()
  })
}

// 创建指令
async function createInstruct({ _this, params, useId }) {
  const { json, createUUID, shell } = _this;

  let uuid = useId && params.id ? params.id : createUUID();
  const data = {
    parent: 'root',
    type: 'shell',
    ...params,
    id: uuid,
    enable: true
  };
  let error = '';
  // 进行必要字段判空
  (['command', 'shell']).find(key => {
    if (!data[key]) {
      error = `${key} can not be empty`;
      return true
    }
  });
  // 禁止创建 shell 子脚本
  if (data.parent === 'shell') {
    error = '不能在 shell 下创建脚本呢!';
  }
  // 如果存在错误直接返回错误
  if (error) return { error };

  // 如果存在 parent 添加到 parent 的子命令中
  if (data.parent !== 'root') {
    let parent = json.get('shell')[data.parent];
    if (!parent) {
      parent = {
        id: createUUID(),
        enable: true,
        command: data.parent,
        alias: '',
        type: 'shell',
        description: '没错, 本脚本帮你建的脚本',
        shell: 'echo 帮你自动设置了命令,不知道执行点什么,输出一个✨吧',
        children: []
      }
      // 判断指令是否存在
      if (shell.which(parent.command)) {
        return { error: `父指令 ${parent.command} 已经存在!` }
      }
      json.get('shell')[data.parent] = parent;
      await buildShell(parent); // 创建父级 js 脚本 与 shell 脚本与子脚本存放目录, 更新 package 文件重新 npm link
    }
    parent.children.push({
      command: data.command || '',
      alias: data.alias || '',
      type: data.type || 'shell',
      description: data.description || '',
      shell: data.shell || '',
      enable: true,
      id: data.id,
      parent: parent.command
    });
    // 如果 脚本类型是 shell 脚本, 创建子脚本的 sh 可执行文件
    if (data.type !== 'javascript' && fileType[data.type]) {
      fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${parent.command}/${data.command}.${fileType[data.type]}`), data.shell);
    }
    // 设置完数据保存到文件
    json.write();
  } else {
    const shellInfo = {
      command: data.command || '',
      alias: data.alias || '',
      type: data.type || 'shell',
      description: data.description || '',
      shell: data.shell || '',
      id: data.id,
      enable: true,
      children: []
    };
    // 判断指令是否存在
    if (shell.which(shellInfo.command)) {
      return { error: `指令 ${shellInfo.command} 已经存在!` };
    }
    json.get('shell')[shellInfo.command] = shellInfo;
    json.write();
    await buildShell(shellInfo); // 创建父级 js 脚本 与 shell 脚本与子脚本存放目录, 更新 package 文件重新 npm link
    return { uuid };
  }
}
// 修改指令
async function editInstruct({ _this, params }) {
  const { json, shell, createUUID } = _this;
  const data = {
    parent: 'root',
    type: 'shell',
    ...params
  };
  let error = ''; // 错误信息
  // 进行必要字段判空
  (['command', 'shell']).find(key => {
    if (!data[key]) {
      error = `${key} can not be empty`;
      return true;
    }
  });
  // 禁止修改 shell 脚本
  if (
    (data.command === 'shell' && data.parent === 'root') || // 禁止修改 shell 脚本
    (data.parent === 'shell') // 禁止修改 shell 子脚本
  ) {
    error = 'shell 脚本禁止修改的呢';
  }
  if (error) return { error };
  // 进行修改, 如果修改父指令那么就需要更新脚本, 如果修改子指令, 直接修改数据即可
  if (data.parent === 'root') {
    // 如果是子指令改为 根指令
    if (data.oldParent) {
      // 先判断指令是否存在
      if (shell.which(data.command)) {
        return { error: `您不能将当前子指令更改为根指令哦, 因为 ${data.command} 已经存在了哦!` };
      }
      // 创建新的根指令的数据
      json.set(`shell.${data.command}`, {
        command: data.command || '',
        alias: data.alias || '',
        type: data.type || 'shell',
        description: data.description || '',
        shell: data.shell || '',
        id: data.id,
        enable: true,
        children: []
      });
      // 删除旧的根指令中的当前指令
      const oldCommand = json.get(`shell.${data.oldParent}`);
      if (oldCommand) {
        oldCommand.children = oldCommand.children.filter(item => item.id !== data.id);
      }
      json.write();
      // 创建指令
      await buildShell(data);
    } else { // 正常的修改根指令
      // 先拿到旧的指令
      const shellData = json.get('shell');
      const oldCommand = Object.keys(shellData).map(_ => shellData[_]).find(item => item.id === data.id);
      // 如果旧指令不存在
      if (!oldCommand) {
        return { error: '您要修改的数据不存在, 请返回上一级重新操作!' };
      }
      // 如果修改了指令名, 那么需要修改指令
      if (oldCommand.command !== data.command) {
        // 判断新指令是否存在
        if (shell.which(data.command)) {
          return { error: `指令 ${data.command} 已经存在` };
        }
        // 删除旧的指令, 创建的脚本, 创建的子脚本 并更新到 package.json
        await deletePackageShell(oldCommand);
        // 删除旧的指令数据
        json.delete(`shell.${oldCommand.command}`);
        // 创建新的数据
        json.set(`shell.${data.command}`, oldCommand);
        // 创建了新的指令, 那么需要更新 shell 脚本
        await buildShell(data);
        // 创建子脚本
        oldCommand.children.forEach(item => {
          if (item.type !== 'javascript' && fileType[item.type]) {
            fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${data.command}/${item.command}.${fileType[item.type]}`), item.shell)
          }
        });
      }
      // 更新指令数据
      json.set(`shell.${data.command}`, {
        ...oldCommand,
        command: data.command,
        alias: data.alias,
        description: data.description || '',
        type: data.type || 'shell',
        shell: data.shell || ''
      });
      // 如果更新了 shell 脚本, 那么需要重新写入 对应的脚本文件, 修改了脚本类型应该删除之前的脚本
      if (oldCommand.shell !== data.shell && data.type !== 'javascript' && fileType[data.type]) {
        // 如果脚本类型发生了变化应该删除之前的脚本
        const oldPath = path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${oldCommand.command}.${fileType[oldCommand.type]}`);
        if (oldCommand.type !== data.type && fs.existsSync(oldPath)) {
          shell.rm('-r', oldPath);
        }
        fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${data.command}.${fileType[data.type]}`), data.shell);
      }
      // 然后写入数据
      json.write();
    }
  } else {
    // 先判断是否是父指令更改为子指令, 因为会丢失子指令, 所以暂时禁止
    if (!data.oldParent) {
      return { error: '暂时不支持将根指令转为子指令呢!!!' };
    }
    // 判断子指令是否修改了父指令
    if (data.parent !== data.oldParent) {
      // 先 删除旧的父指令中的该子指令
      const oldParentCommand = json.get(`shell.${data.oldParent}`);
      let oldItm = null; // 要修改的指令
      if (oldParentCommand) {
        oldParentCommand.children = oldParentCommand.children.filter(item => item.id !== data.id);
        oldItm = oldParentCommand.children.find(item => item.id === data.id);
        if (oldItm && oldItm.type !== 'javascript' && fileType[oldItm.type]) {
          // 删除旧的子 shell 脚本
          shell.rm('-f', path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${oldParentCommand.command}/${oldItm.command}.${fileType[oldItm.type]}`));
        }
      }
      // 在将新的子指令写入对应的父指令
      const parentCommand = json.get(`shell.${data.parent}`);
      if (!parentCommand) {
        return { error: `您选择的父指令 "${data.parent}" 似乎不存在呢, 是不是那个小伙伴给删除了呢...` };
      }
      parentCommand.children.push({
        command: data.command,
        alias: data.alias,
        description: data.description || '',
        type: data.type || 'shell',
        shell: data.shell || '',
        enable: oldItm ? oldItm.enable : true,
        id: data.id || createUUID()
      });
      // 如果是 shell 删除旧的文件夹中的 shell 脚本, 并创建新的脚本
      if (data.type !== 'javascript' && fileType[data.type]) {
        fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${parentCommand.command}/${data.command}.${fileType[data.type]}`), data.shell || '');
      }
      // 保存到 json
      json.write();
    } else {
      // 只是简单的修改了子指令的值
      const parent = json.get(`shell.${data.parent}`);
      const item = parent.children.find(item => item.id === data.id);
      if (!item) {
        return { error: '找不到您要修改的指令呢.... 请返回上一级刷新最新的数据呢....' }
      }
      // 如果修改了子指令的 command 并且 type 是 shell 类型的
      if (item.command !== data.command && item.type !== 'javascript') {
        // 删除旧的子指令
        shell.rm('-f', path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${parent.command}/${item.command}.${fileType[item.type]}`));
      }
      item.command = data.command;
      item.alias = data.alias;
      item.description = data.description || '';
      item.type = data.type || 'shell';
      item.shell = data.shell || '';
      // 如果新的子指令是 shell 类型的, 创建新的子 shell 脚本
      if (item.type !== 'javascript' && fileType[item.type]) {
        fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${parent.command}/${item.command}.${fileType[item.type]}`), item.shell);
      }
      json.write();
    }
  }
  return { success: true, data: params };
}

module.exports = {
  reLoadPackage,
  buildShell,
  deletePackageShell,
  createInstruct,
  editInstruct
}
