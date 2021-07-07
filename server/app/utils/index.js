'use strict';
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const JSONDB = require('../../../utils/jsonDB');
const windowInstall = require('./windowsInstall');
const windowUnInstall = require('./windowuninstall');

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
    packageJson.get('bin')[command.command] = `../shell-ui-database/lib/userScript/${command.command}.js`;
    command.alias && (packageJson.get('bin')[command.alias] = packageJson.get('bin')[command.command]);
    packageJson.write();
    packageJson.destroy();
    if (shell.which('shell')) {
      const paths = shell.which('shell').stdout.toLowerCase();
      // 判断系统
      if (process.platform === 'win32') {
        windowInstall(paths, command)
      } else {
        // 链接文件
        Array.from(new Set([command.command, command.alias])).forEach(cmd => {
          if (!cmd) return
          const tempPath = paths.replace(/[\\\/]shell$/g, `/${cmd}`);
          // 如果之前存在软链接, 需要删除软链接防止创建软链接失败
          if (fs.existsSync(tempPath) && fs.lstatSync(tempPath).isSymbolicLink(tempPath)) {
            shell.rm('-r', tempPath);
          }
          fs.symlinkSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userScript/${command.command}.js`), tempPath);
          shell.chmod('777', tempPath); // 程序可执行
        });
      }

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
function deletePackage(command) {
  // 引入 package.json
  const packageJson = new JSONDB({
    path: path.resolve(__dirname, '../../../package.json')
  });
  // 删除 command 的指令并保存
  packageJson.delete(`bin.${command.command}`)
  command.alias && packageJson.delete(`bin.${command.alias}`);
  packageJson.write().destroy();
  // 删除软链接
  if (process.platform === 'win32') {
    windowUnInstall(command);
  } else {
    Array.from(new Set([command.command, command.alias])).forEach(cmd => {
      if (!cmd) return;
      // 删除指令数据
      if (shell.which(cmd)) {
        shell.rm('-f', shell.which(cmd).stdout);
      }
    });
  }
}
function deletePackageShell(command) {
  return new Promise(resolve => {
    deletePackage(command);
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
    // 进行子指令去重
    if (parent.children.find(_ => _.command === data.command)) {
      return { error: `子指令 ${data.command} 已经存在!` };
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
    return { pass: true };
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
    if (shellInfo.alias !== shellInfo.command && shellInfo.alias && shell.which(shellInfo.alias)) {
      return { error: `指令简写 ${shellInfo.alias} 已经存在!` };
    }
    json.get('shell')[shellInfo.command] = shellInfo;
    json.write();
    await buildShell(shellInfo); // 创建父级 js 脚本 与 shell 脚本与子脚本存放目录, 更新 package 文件重新 npm link
    return { uuid, pass: true };
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
      if (data.alias !== data.command && data.alias && shell.which(data.alias)) {
        return { error: `指令简写 ${data.alias} 已经存在!` };
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
        nodeModule: [],
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
        // 创建子脚本 并 同步子脚本 parent 字段
        oldCommand.children.forEach(item => {
          item.parent = data.command;
          if (item.type !== 'javascript' && fileType[item.type]) {
            fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${data.command}/${item.command}.${fileType[item.type]}`), item.shell)
          }
        });
      }
      // 如果修改了指令简写, 那么要删除之前旧的指令简写, 并且创建新的指令简写
      if (oldCommand.alias !== data.alias) {
        // 判断新的指令简写是否存在
        if (data.alias !== data.command && data.alias && shell.which(data.alias)) {
          return { error: `指令简写 ${data.alias} 已经存在!` };
        }
        // 删除旧的指令软链数据, 写入新的软链
        deletePackage(oldCommand);
        await reLoadPackage(data);
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
// 删除指令
async function removeInstruct({ _this, params }) {
  const { json, shell } = _this;
  const shellData = json.get('shell');
  // 先获取到要删除的脚本, 先判断要删除的脚本是不是根指令
  let command = null;
  Object.keys(shellData).find(key => {
    const item = shellData[key];
    if (item.id === params.id) {
      command = item;
      return true;
    }
    for (let childItem of item.children) {
      if (childItem.id === params.id) {
        command = childItem;
        return true;
      }
    }
    return false
  });
  if (!command) {
    return { error: `您要删除的指令 ${command.command} 不存在呢!` }
  }
  // 删除父脚本的要同时删除子脚本, 删除可执行指令, 删除 package.json 中的值
  if (!command.parent) {
    // 删除父脚本
    await deletePackageShell(command);
    // 删除父脚本数据
    json.delete(`shell.${command.command}`);
    json.write();
  } else {
    // 删除子脚本的要同时删除 shell 子脚本文件
    if (command.type === 'shell') {
      shell.rm('-f', path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.parent}/${command.command}.sh`));
    }
    // 删除子脚本数据
    const parent = shellData[command.parent];
    if (parent) {
      parent.children = parent.children.filter(item => item.id !== command.id);
      json.write();
    }
  }
  return { pass: true, command };
}
// 查询某个指令的数据
async function getInstructFromName({ _this, params }) {
  const { json, shell } = _this;
  const shellData = json.get('shell');
  let command = null;
  let error = '';
  // 如果是根元素, 直接获取即可
  if (!params.parent || params.parent === 'root') {
    if (shellData[params.command]) {
      command = shellData[params.command];
    } else {
      error = `指令 ${params.command} 不存在!`;
    }
  } else {
    // 不是根元素, 则需要根据父元素获取对应子元素
    if (shellData[params.parent]) {
      error = `指令 ${params.command} 不存在!`;
      shellData[params.parent].children.find(item => {
        if (item.command === params.command) {
          command = item;
          error = '';
          return true;
        }
      });
    } else {
      error = `根指令 ${params.parent} 不存在!`;
    }
  }
  return { error, command }
}
// 启用 | 禁用 某个指令
async function enableInstruct({ _this, params }) {
  const { json, shell, JSONDB } = _this;
  // 首选找到脚本
  const shellData = json.get('shell');
  // 先获取到要删除的脚本, 先判断要删除的脚本是不是根指令
  let command = null;
  let error = '';
  Object.keys(shellData).find(key => {
    const item = shellData[key];
    if (item.id === params.id) {
      command = item;
      return true;
    }
    for (let childItem of item.children) {
      if (childItem.id === params.id) {
        command = childItem;
        return true;
      }
    }
    return false
  });
  if (!command) {
    return { error: `您要操作的指令 ${params.command} 不存在呢!` };
  }
  // 引入 package.json
  const packageJson = new JSONDB({
    path: path.resolve(__dirname, '../../../package.json')
  });
  // 如果是启用根脚本, 重新创建可执行脚本与子脚本
  // 如果是禁用根脚本, 删除可执行脚本与子脚本
  if (!command.parent) {
    if (params.enable) {
      if (shell.which(command.command)) {
        return { error: `指令 ${command.command} 已经存在, 请换个名字在重试呢` }
      }
      await buildShell(command); // 创建可执行脚本
      // 创建子脚本
      if (command.children && command.children.length) {
        command.children.forEach(item => {
          if (item.type === 'shell') {
            fs.writeFileSync(path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.command}/${item.command}.sh`), item.shell)
          }
        });
      }
    } else {
      // 删除 command 的指令并保存
      packageJson.delete(`bin.${command.command}`).write();
      packageJson.destroy();
      // 删除指令数据
      if (shell.which(command.command)) {
        shell.rm('-f', shell.which(command.command).stdout);
      }
    }
    // 修改数据
    command.enable = !!params.enable;
  } else {
    command.enable = !!params.enable;
  }
  json.write();
  return { pass: true, command };
}
// 导入指令
async function importInstruct({ _this, json, onRepeat = '', onAliasRepeat = '' }) {
  // 创建指令, 如果 id 存在,修改 ID 并进行创建(相当于合并操作), 如果指令存在, 修改指令,
  const errors = []; // 记录数据错误, 创建失败等指令, 根指令
  const errorsChild = []; // 记录子指令出现错误的数据
  const ignores = []; // 记录用户手动忽略的数据, 只记录根指令
  const ignoreChild = []; // 记录用户手动忽略的子指令数据
  // 获取目前已经存在的指令
  let currentInstruct = require(path.resolve(__dirname, '../../../../shell-ui-database/json/shell.json'));
  currentInstruct = currentInstruct.shell || {};

  // todo 解耦逻辑, 抽离 utils 处理逻辑
  function ask_user(command, root = true) {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'repeat',
        message: `${root ? '根' : '子'}指令 ${command.command} 已经存在,请问要怎么处理呢?`,
        choices: root ? [
          { name: '合并(编辑)', value: 'merge' },
          { name: '忽略(不导入这条指令)', value: 'ignore' },
          { name: '新建(指令后追加 _repeat 然后新建指令)', value: 'add' },
          { name: '全部合并(注意:之后的根指令以及子指令如果重复也都将进行合并处理,请谨慎选择)', value: 'merge_all' },
          { name: '全部忽略(注意:之后的根指令以及子指令如果重复也都会忽略不导入,请谨慎选择)', value: 'ignore_all' },
          { name: '全部新建(注意:之后的根指令以及子指令如果重复也都将进行新建处理,请谨慎选择)', value: 'add_all' }
        ] : [
          { name: '合并(编辑)', value: 'merge' },
          { name: '忽略(不导入这条指令)', value: 'ignore' },
          { name: '新建(指令后追加 _repeat 然后新建指令)', value: 'add' },
          { name: '全部合并(只针对当前根指令的重复的子指令)', value: 'merge_all' },
          { name: '全部忽略(只针对当前根指令的重复子指令)', value: 'ignore_all' },
          { name: '全部新建(只针对当前根指令的重复子指令)', value: 'add_all' }
        ]
      }
    ])
  }
  function ask_user_alias(command, root = true) {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'repeat',
        message: `${root ? '根' : '子'}指令 ${command.command} 的指令简写 ${command.alias} 已经存在, 请问要怎么处理呢?`,
        choices: root ? [
          { name: '忽略(不导入这条指令)', value: 'ignore' },
          { name: '新建(指令后追加 _alias_repeat 然后新建指令)', value: 'add' },
          { name: '全部忽略(注意:之后的根指令以及子指令如果重复也都会忽略不导入,请谨慎选择)', value: 'ignore_all' },
          { name: '全部新建(注意:之后的根指令以及子指令如果重复也都将进行新建处理,请谨慎选择)', value: 'add_all' }
        ] : [
          { name: '忽略(不导入这条指令)', value: 'ignore' },
          { name: '新建(指令后追加 _alias_repeat 然后新建指令)', value: 'add' },
          { name: '全部忽略(只针对当前根指令的重复子指令)', value: 'ignore_all' },
          { name: '全部新建(只针对当前根指令的重复子指令)', value: 'add_all' }
        ]
      }
    ])
  }
  // 抽离指令合并处理逻辑
  async function detail_merge (command, globalChoose, globalAliasChoose, currentInstruct, root) {
    let itemChoose = globalChoose, oldCommand = null, suffix = ''; // suffix 追加的后缀, itemChoose 指令处理方式 add|edit|ignore
    const currentInstructArr = Object.keys(currentInstruct).map(_ => currentInstruct[_]); // 现有的指令的数组结构
    if (currentInstruct[command.command]) {
      // 存在与否, 无论存在与否都会询问, 无需特殊处理 todo _repeat 并不能保证不重复, 应该采用 md5 后缀
      if (!globalChoose) {
        const userChoose = await ask_user(command, root);
        switch (userChoose.repeat) {
          case 'merge': itemChoose = 'merge'; oldCommand = currentInstruct[command.command]; break;
          case 'add': itemChoose = 'add'; break;
          case 'ignore': itemChoose = 'ignore'; break;
          case 'merge_all': globalChoose = 'merge'; itemChoose = 'merge'; break;
          case 'add_all': globalChoose = 'add'; itemChoose = 'add'; break;
          case 'ignore_all': globalChoose = 'ignore'; itemChoose = 'ignore'; break;
        }
      }
      suffix = itemChoose === 'add' ? '_repeat' : '';
    } else if (currentInstruct[command.alias]) {
      // 走到这里 command 必然不会重复, 直接询问即可
      if (!globalAliasChoose) {
        const userChoose = await ask_user_alias(command, root);
        switch (userChoose.repeat) {
          case 'ignore': itemChoose = 'ignore'; break;
          case 'add': itemChoose = 'add'; break;
          case 'ignore_all': globalAliasChoose = 'ignore'; itemChoose = 'ignore'; break;
          case 'add_all': globalAliasChoose = 'add'; itemChoose = 'add'; break
        }
      } else {
        itemChoose = globalAliasChoose;
      }
      suffix = itemChoose === 'add' ? '_alias_repeat' : '';
    } else {
      // 找出是否与 alias 重复
      if (currentInstructArr.find(_ => _.alias === command.command || _.alias === command.alias)) {
        if (!globalAliasChoose) {
          const userChoose = await ask_user_alias(command, root);
          switch (userChoose.repeat) {
            case 'ignore': itemChoose = 'ignore'; break;
            case 'add': itemChoose = 'add'; break;
            case 'ignore_all': globalAliasChoose = 'ignore'; itemChoose = 'ignore'; break;
            case 'add_all': globalAliasChoose = 'add'; itemChoose = 'add'; break
          }
        } else {
          itemChoose = globalAliasChoose
        }
        suffix = itemChoose === 'add' ? '_alias_exist' : '';
      } else {
        // 没有重复, 完全新建
        itemChoose = 'add';
      }
    }
    let result = {};
    // 写入根指令
    switch (itemChoose) {
      case 'merge':
        // 编辑要把 id 修改为旧的相同指令的 id , 不然无法编辑
        if (oldCommand) command.id = oldCommand.id;
        result = await editInstruct({ _this, params: command });
        break;
      case 'add':
        // 判断 ID 是否存在, ID 如果已经存在那么修改一下 ID 在进行创建
        if (Object.keys(currentInstruct).find(key => currentInstruct[key].id === command.id)) {
          command.id = _this.createUUID();
        }
        // 重新改指令名
        if (suffix) {
          command.command += suffix;
          command.alias += suffix;
        }
        result = await createInstruct({ _this, params: command, useId: true });
        break;
      case 'ignore':
        result = { ignore: true };
        break;
    }
    return { globalChoose, globalAliasChoose, result, itemChoose, suffix }
  }

  let globalChoose = onRepeat, globalAliasChoose = onAliasRepeat;
  // 如果与现有指令冲突, 追加 _repeat 来标记冲突项, 让用户自己去处理
  for (let item of json) {
    /** 筛选出来不存在的执行新建命令
     *  筛选出来存在的根指令, 询问如何操作, 提供 合并(编辑) 新建(追加_repeat 后缀) 全部合并 与 全部新建命令
     *  然后筛选出来对应的子指令, 重复的询问操作, 提供 合并(编辑) 新建(追加_repeat 后缀) 全部合并(只针对当前根指令的子指令) 全部新建(同左边)
     */
    const detailData = await detail_merge(item, globalChoose, globalAliasChoose, currentInstruct, true);
    // 形参不能改变原数据, 修改存储的原数据
    globalChoose = detailData.globalChoose;
    globalAliasChoose = detailData.globalAliasChoose;

    // 如果出错展示记录错误信息
    if (detailData.result.error) {
      errors.push({
        root: true,
        error: detailData.result.error,
        command: item.command,
        id: item.id,
        instruct: item
      });
    }
    if (detailData.result.ignore) {
      ignores.push({
        root: true,
        command: item.command,
        instruct: item
      });
    }
    // 处理子指令, 新建的话子指令绝对不会重复, 合并才可能重复, 忽略的话子指令也将忽略
    if (detailData.itemChoose !== 'ignore') {
      if (!item.children) continue;
      let childChoose = globalChoose, childAlias = globalAliasChoose;

      // 合并才有必要传入现有数据, 新增无需现有数据直接新增即可
      const childInstruct = {};
      detailData.itemChoose === 'merge' && item.children.forEach(_ => childInstruct[_.command] = _);

      for (let child of item.children) {
        // 更改了父指令的 command 也需要修改子指令的 parent
        if (detailData.suffix) {
          child.parent = item.command;
        }
        const childDetailData = await detail_merge(child, childChoose, childAlias, childInstruct, false);
        // 形参不能改变原数据, 修改存储的原数据
        childChoose = childDetailData.globalChoose;
        childAlias = childDetailData.globalAliasChoose;
        if (childDetailData.result.error) {
          errorsChild.push({
            root: false,
            parent: item,
            error: childDetailData.result.error,
            parentCommand: item.command,
            command: child.command,
            id: child.id,
            instruct: child
          });
        }
        if (childDetailData.result.ignore) {
          ignoreChild.push({
            root: false,
            parent: item,
            parentCommand: item.command,
            command: child.command,
            instruct: child
          });
        }
      }
    }
  }
  // todo 忽略数据, 记录并返回, 成功数区分根指令与子指令
  return {
    successRoot: json.length - errors.length,
    failRoot: errors.length,
    ignoreRoot: ignores.length,
    failChild: errorsChild.length,
    ignoreChild: ignoreChild.length,
    failRootData: errors,
    failChildData: errorsChild,
    ignoreRootData: ignores,
    ignoreChildData: ignoreChild
  };
}
// todo 如果是 nodeJS npm 包抽离出来并安装 npm 模块, 使支持 npm 模块
async function installNpmModule({ params, json }) {
  const modules = getNodeModules(params.command); // 获取要引入的 npm 模块
  // 所有指令用到的 npm 模块统一放到根指令的 nodeModules 字段中, nodeModules 字段不可重复
  // 每个指令执行位置都加一个 node_module 安装的 package.json, 为每个指令添加一个执行环境
}
// 获取 js 脚本的 node-modules 模块
function getNodeModules(command = '') {
  // 剔除掉 node 原生模块 以 v14.15.4 为准
  const nodeModules = ['assert', 'async_hooks', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'util', 'tls', 'trace_events', 'tty', 'url', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib'];
  return (command.match(/require\(['"][^'"]+["']\)/g) || []).map(item => item.replace(/require\(['"]/g, '').replace(/['"]\)/g, '')).filter(item => !nodeModules.includes(item));
}

module.exports = {
  reLoadPackage,
  buildShell,
  deletePackageShell,
  createInstruct,
  editInstruct,
  removeInstruct,
  getInstructFromName,
  enableInstruct,
  importInstruct
}
