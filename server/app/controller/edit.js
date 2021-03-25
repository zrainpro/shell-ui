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
    const params = ctx.request.body;
    const result = utils.createInstruct({ _this: this, params });
    if (result.error) {
      ctx.throw(result.error);
    }
    ctx.body = {
      code: 200,
      data: result.uuid,
      message: '创建成功'
    };
  }
  // 编辑脚本
  async edit (ctx, next) {
    const params = ctx.request.body;
    const result = await utils.editInstruct({ _this: this, params });
    if (result.error) {
      ctx.throw(result.error);
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
        shell.rm('-f', path.resolve(__dirname, `../../../../shell-ui-database/lib/userShell/${command.parent}/${command.command}.sh`));
      }
      // 删除子脚本数据
      const parent = shellData[command.parent];
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
    ctx.body = {
      code: 200,
      data: true,
      message: command.enable ? '启用成功' : '禁用成功'
    }
  }
}

module.exports = Edit;
