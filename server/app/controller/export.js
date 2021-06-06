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
    // todo 前端应该允许设置导入选项, 配置当遇到重复指令与 alias 重复的时候的应该如何处理, 支持 add 添加 merge 合并 ignore 忽略, 目前默认新增
    const result = await utils.importInstruct({ _this: this, json, onRepeat: 'add', onAliasRepeat: 'add' });

    // 返回相关信息, 并将导入失败的原因返回
    ctx.body = {
      code: 200,
      data: true,
      ...result
    }
  }
}

module.exports = Export;
