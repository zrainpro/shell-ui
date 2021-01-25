'use strict';
const Base = require('../utils/baseClass');

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

  }
}

module.exports = Export;
