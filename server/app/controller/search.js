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
    let data = Object.keys(shellData).map(key => shellData[key]);
    // 关键字搜索
    if (params.keywords) {
      data = data.filter(item => item.command.includes(params.keywords) || item.alias.includes(params.keywords) || item.description.includes(params.keywords) || item.shell.includes(params.keywords))
    }
    // 类型搜索
    if (params.type) {
      data = data.filter(item => item.type === params.type);
    }
    // 启用禁用搜索
    if (params.enable) {
      data = data.filter(item => item.enable === (params.enable === 1));
    }
    ctx.body = {
      code: 200,
      data: data
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
