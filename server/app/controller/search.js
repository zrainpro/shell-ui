'use strict';
const Base = require('../utils/baseClass');

class Search extends Base {
  constructor(props) {
    super(props);
  }

  // 获取 shell 指令
  async index (ctx, next) {
    const { json } = this;
    const shellData = json.get('shell');
    const params = ctx.query; // 关键字搜索, 类型搜索
    let data = Object.keys(JSON.parse(JSON.stringify(shellData))).map(key => shellData[key]);
    // 二级子脚本数据也放进去, 搜索应该涵盖二级子脚本, 打平成一维数据
    data = data.reduce((source, item) => {
      return [...source, item, ...(item.children || [])]
    }, [])
    // 关键字搜索
    if (params.keywords) {
      data = data.filter(item => item.command.includes(params.keywords) || item.alias.includes(params.keywords) || item.description.includes(params.keywords) || item.shell.includes(params.keywords));
    }
    const backData = JSON.parse(JSON.stringify(data));
    // 类型搜索
    if (params.type) {
      data = data.filter(item => item.type === params.type);
    }
    // 启用禁用搜索
    if (params.enable) {
      data = data.filter(item => item.enable === (params.enable === 1));
    }
    // 将打平的一维数据还原成二维数据
    const tempData = {};
    data.forEach(item => {
      if (!item.parent) {
        // 根脚本
        tempData[item.command] = { ...item, init: true };
      } else {
        // 子脚本, 先判断之前父脚本有没有 children, 如果有 children 应该置空 children, 如果父脚本不存在, 先找到父脚本
        let parentData = tempData[item.parent];
        if (!parentData) {
          // 找到父级数据
          parentData = JSON.parse(JSON.stringify(shellData))[item.parent];
          parentData.init = true;
          tempData[item.parent] = parentData;
        }
        // 如果父级数据是没有处理过子脚本筛选的, 先置空子数据
        if (parentData.init) {
          parentData.init = false;
          parentData.children = [];
        }
        parentData.children.push(item);
      }
    });
    const returnData = Object.entries(tempData).map(([key, obj]) => {
      // 先删除上面处理手动加的字段
      delete obj.init;
      return obj
    })
    ctx.body = {
      code: 200,
      data: returnData,
      backData
    }
  }
  // 获取 shell 根指令
  async root (ctx, next) {
    const { json } = this;
    const data = json.get('shell');
    ctx.body = {
      code: 200,
      data: Object.keys(data).filter(item => item.type !== 'shell')
    }
  }
  // 获取单个脚本
  async single (ctx, next) {
    const { json } = this;
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
      ctx.throw(`您要获取的指令 ${command.command} 不存在呢!`)
    }
    ctx.body = {
      code: 200,
      data: command
    }
  }
}

module.exports = Search
