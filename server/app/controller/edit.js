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
    const params = ctx.params;
    const result = await utils.removeInstruct({ _this: this, params });
    if (result.error) {
      ctx.throw(result.error);
    }
    ctx.body = {
      code: 200,
      data: command,
      message: '删除成功'
    }
  }
  // 启用禁用
  async enable (ctx, next) {
    const params = ctx.request.body;
    const result = await utils.enableInstruct({ _this: this, params });
    if (result.error) {
      ctx.throw(result.error);
    }
    ctx.body = {
      code: 200,
      data: true,
      message: command.enable ? '启用成功' : '禁用成功'
    }
  }
}

module.exports = Edit;
