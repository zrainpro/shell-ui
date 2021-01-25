'use strict';
const Base = require('../utils/baseClass');
const utils = require('../utils/index');
const fs = require('fs');
const path = require('path');

class Edit extends Base {
  constructor(props) {
    super(props);
  }
  // 创建脚本
  async create (ctx, next) {
    const { json, createUUID, shell } = this;

    let uuid = createUUID();
    const data = {
      parent: 'root',
      type: 'shell',
      ...ctx.request.body,
      id: uuid,
      enable: true
    };
    // 进行必要字段判空
    (['command', 'shell']).forEach(key => {
      if (!data[key]) {
        ctx.throw(`${key} can not be empty`);
      }
    });
    // 禁止创建 shell 子脚本
    if (data.parent === 'shell') {
      ctx.throw('不能在 shell 下创建脚本呢!');
    }
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
          ctx.throw(`父指令 ${parent.command} 已经存在!`)
        }
        json.get('shell')[data.parent] = parent;
        await utils.buildShell(parent); // 创建父级 js 脚本 与 shell 脚本与子脚本存放目录, 更新 package 文件重新 npm link
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
      if (data.type === 'shell') {
        fs.writeFileSync(path.resolve(__dirname, `../../../lib/userShell/${parent.command}/${data.command}.sh`), data.shell);
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
        ctx.throw(`指令 ${shellInfo.command} 已经存在!`)
      }
      json.get('shell')[shellInfo.command] = shellInfo;
      json.write();
      await utils.buildShell(shellInfo); // 创建父级 js 脚本 与 shell 脚本与子脚本存放目录, 更新 package 文件重新 npm link
    }
    ctx.body = {
      code: 200,
      data: uuid,
      message: '创建成功'
    };
  }
  // 编辑脚本
  async edit (ctx, next) {
    const { json, shell } = this;
    const data = {
      parent: 'root',
      type: 'shell',
      ...ctx.request.body
    };
    // 进行必要字段判空
    (['command', 'shell']).forEach(key => {
      if (!data[key]) {
        ctx.throw(`${key} can not be empty`);
      }
    });
    // 禁止修改 shell 脚本
    if (
      (data.command === 'shell' && data.parent === 'root') || // 禁止修改 shell 脚本
      (data.parent === 'shell') // 禁止修改 shell 子脚本
    ) {
      ctx.throw('shell 脚本禁止修改的呢')
    }
    // 进行修改, 如果修改父指令那么就需要更新脚本, 如果修改子指令, 直接修改数据即可
    if (data.parent === 'root') {
      // 如果是子指令改为 根指令
      if (data.oldParent) {
        // 先判断指令是否存在
        if (shell.which(data.command)) {
          ctx.throw(`您不能将当前子指令更改为根指令哦, 因为 ${data.command} 已经存在了哦!`);
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
        await utils.buildShell(data);
      } else { // 正常的修改根指令
        // 先拿到旧的指令
        const shellData = json.get('shell');
        const oldCommand = Object.keys(shellData).map(_ => shellData[_]).find(item => item.id === data.id);
        // 如果旧指令不存在
        if (!oldCommand) {
          ctx.throw('您要修改的数据不存在, 请返回上一级重新操作!')
        }
        // 如果修改了指令名, 那么需要修改指令
        if (oldCommand.command !== data.command) {
          // 判断新指令是否存在
          if (shell.which(data.command)) {
            ctx.throw(`指令 ${data.command} 已经存在`);
          }
          // 删除旧的指令, 创建的脚本, 创建的子脚本 并更新到 package.json
          await utils.deletePackageShell(oldCommand);
          // 删除旧的指令数据
          json.delete(`shell.${oldCommand.command}`);
          // 创建新的数据
          json.set(`shell.${data.command}`, oldCommand);
          // 创建了新的指令, 那么需要更新 shell 脚本
          await utils.buildShell(data);
          // 创建子脚本
          oldCommand.children.forEach(item => {
            if (item.type === 'shell') {
              fs.writeFileSync(path.resolve(__dirname, `../../../lib/userShell/${data.command}/${item.command}.sh`), item.shell)
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
        // 如果更新了 shell 脚本, 那么需要重新写入 sh 文件
        if (oldCommand.shell !== data.shell) {
          fs.writeFileSync(path.resolve(__dirname, `../../../lib/userShell/${data.command}.sh`), data.shell);
        }
        // 然后写入数据
        json.write();
      }
    } else {
      // 先判断是否是父指令更改为子指令, 因为会丢失子指令, 所以暂时禁止
      if (!data.oldParent) {
        ctx.throw('暂时不支持将根指令转为子指令呢!!!')
      }
      // 判断子指令是否修改了父指令
      if (data.parent !== data.oldParent) {
        // 先 删除旧的父指令中的该子指令
        const oldParentCommand = json.get(`shell.${data.oldParent}`);
        let oldItm = null; // 要修改的指令
        if (oldParentCommand) {
          oldParentCommand.children = oldParentCommand.children.filter(item => item.id !== data.id);
          oldItm = oldParentCommand.children.find(item => item.id === data.id);
          if (oldItm && oldItm.type === 'shell') {
            // 删除旧的子 shell 脚本
            shell.rm('-f', path.resolve(__dirname, `../../../lib/userShell/${oldParentCommand.command}/${oldItm.command}.sh`));
          }
        }
        // 在将新的子指令写入对应的父指令
        const parentCommand = json.get(`shell.${data.parent}`);
        if (!parentCommand) {
          ctx.throw(`您选择的父指令 "${data.parent}" 似乎不存在呢, 是不是那个小伙伴给删除了呢...`)
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
        if (data.type === 'shell') {
          fs.writeFileSync(path.resolve(__dirname, `../../../lib/userShell/${parentCommand.command}/${data.command}.sh`), data.shell || '');
        }
        // 保存到 json
        json.write();
      } else {
        // 只是简单的修改了子指令的值
        const parent = json.get(`shell.${data.parent}`);
        const item = parent.children.find(item => item.id === data.id);
        if (!item) {
          ctx.throw('找不到您要修改的指令呢.... 请返回上一级刷新最新的数据呢....')
        }
        // 如果修改了子指令的 command 并且 type 是 shell 类型的
        if (item.command !== data.command && item.type === 'shell') {
          // 删除旧的子指令
          shell.rm('-f', path.resolve(__dirname, `../../../lib/userShell/${parent.command}/${item.command}.sh`));
        }
        item.command = data.command;
        item.alias = data.alias;
        item.description = data.description || '';
        item.type = data.type || 'shell';
        item.shell = data.shell || '';
        // 如果新的子指令是 shell 类型的, 创建新的子 shell 脚本
        if (item.type === 'shell') {
          fs.writeFileSync(path.resolve(__dirname, `../../../lib/userShell/${parent.command}/${item.command}.sh`), item.shell);
        }
        json.write();
      }
    }
    ctx.body = {
      code: 200,
      data: true,
      message: '修改成功'
    }
  }
  // 删除脚本
  async remove (ctx, next) {
    const { json, shell } = this;
    const params = ctx.params;
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
      ctx.throw(`您要删除的指令 ${command.command} 不存在呢!`)
    }
    // 删除父脚本的要同时删除子脚本, 删除可执行指令, 删除 package.json 中的值
    if (!command.parent) {
      // 删除父脚本
      await utils.deletePackageShell(command);
      // 删除父脚本数据
      json.delete(`shell.${command.command}`);
      json.write();
    } else {
      // 删除子脚本的要同时删除 shell 子脚本文件
      if (command.type === 'shell') {
        shell.rm('-f', path.resolve(__dirname, `../../../lib/userShell/${command.parent}/${command.command}.sh`));
      }
      // 删除子脚本数据
      const parent = json.get(command.parent);
      if (parent) {
        parent.children = parent.children.filter(item => item.id !== command.id);
        json.write();
      }
    }
    ctx.body = {
      code: 200,
      data: command,
      message: '删除成功'
    }
  }
  // 启用禁用
  async enable (ctx, next) {
    const { json, shell, JSONDB } = this;
    const params = ctx.request.body;
    // 首选找到脚本
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
      ctx.throw(`您要操作的指令 ${command.command} 不存在呢!`)
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
          ctx.throw(`指令 ${command.command} 已经存在, 请换个名字在重试呢`)
        }
        await utils.buildShell(command); // 创建可执行脚本
        // 创建子脚本
        if (command.children && command.children.length) {
          command.children.forEach(item => {
            if (item.type === 'shell') {
              fs.writeFileSync(path.resolve(__dirname, `../../../lib/userShell/${command.command}/${item.command}.sh`), item.shell)
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
    ctx.body = {
      code: 200,
      data: true,
      message: command.enable ? '启用成功' : '禁用成功'
    }
  }
}

module.exports = Edit;
