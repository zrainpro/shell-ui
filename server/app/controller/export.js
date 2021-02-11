'use strict';
const Base = require('../utils/baseClass');
const utils = require('../utils/index');
const fs = require('fs');
const path = require('path');

class Export extends Base {
  constructor(props) {
    super(props);
  }
  // 导出
  async export (ctx, next) {
    const { json } = this;
    const params = ctx.query;
    params.ids = params.ids.split(',').filter(_ => _);
    const shellData = json.get('shell');
    // 先获取到要导出的全部脚本
    let command = {};
    Object.keys(shellData).find(key => {
      const item = shellData[key];
      let idsIndex = params.ids.findIndex(id => id === item.id);
      if (idsIndex > -1) {
        command[key] = item;
        delete params.ids[idsIndex]; // 删除寻找的 id
        if (!params.ids.length) {
          return true;
        }
      }
      // 在判断子指令是否在要导出的列表中
      for (let childItem of item.children) {
        idsIndex = params.ids.findIndex(id => id === childItem.id);
        if (idsIndex > -1) {
          if (command[childItem.parent] && command[childItem.parent].tempChildren) {
            command[childItem.parent].tempChildren.push(childItem);
          } else {
            command[childItem.parent] = item;
            command[childItem.parent].tempChildren = [childItem]
          }
          delete params.ids[idsIndex]; // 删除寻找的 id
          if (!params.ids.length) {
            return true;
          }
        }
      }
      return false
    });

    const download = Object.keys(command).map(key => {
      const item = command[key];
      let children = item.children;
      if (item.tempChildren) {
        children = item.tempChildren;
        delete item.tempChildren;
      }
      return {
        ...item,
        children
      }
    });

    ctx.body = {
      code: 200,
      data: download
    };
  }
  // 导入
  async import (ctx, next) {
    // 获取数据流
    const requestFile = ctx.request.files.file;
    const stream = fs.createReadStream(requestFile.path);
    // 写入临时文件
    const filePath = path.resolve(__dirname, './import.json');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    const file = fs.createWriteStream(filePath);
    stream.pipe(file);
    const json = await new Promise(resolve => {
      file.on('finish', () => {
        const json = require(filePath);
        // 删除文件
        fs.unlinkSync(filePath);
        resolve(json);
      })
    });
    // 创建指令, 如果 id 存在,修改 ID 并进行创建(相当于合并操作), 如果指令存在, 修改指令,
    const errors = []; // 记录数据错误, 创建失败等指令
    // 获取目前已经存在的指令
    let currentInstruct = require(path.resolve(__dirname, '../../../../shell-ui-database/json/shell.json'));
    currentInstruct = currentInstruct.shell || {};
    for (let item of json) {
      let result = {};
      if (currentInstruct[item.command] || currentInstruct[item.alias]) {
        // 指令已经存在了, 修改指令 todo 这样直接修改会直接覆盖子指令,待修复
        result = await utils.editInstruct({ _this: this, params: item });
      } else {
        // 新创建指令
        const params = item;
        // 判断 ID 是否存在, ID 如果已经存在那么修改一下 ID 在进行创建
        if (Object.keys(currentInstruct).find(key => currentInstruct[key].id === params.id)) {
          params.id = this.createUUID();
        }
        result = await utils.createInstruct({ _this: this, params: item, useId: true });
      }
      // 如果出错展示记录错误信息
      if (result.error) {
        errors.push({
          error: result.error,
          command: item.command,
          id: item.id,
          instruct: item
        });
      }
    }

    // 返回相关信息, 并将导入失败的原因返回
    ctx.body = {
      code: 200,
      data: true,
      errors
    }
  }
}

module.exports = Export;
