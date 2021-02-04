'use strict';
const JSONDB = require('../../../utils/jsonDB');
const path = require('path');

class Base {
  constructor(props) {
    this.JSONDB = JSONDB;
    // 创建 shell 脚本存放数据库
    this.json = new JSONDB({
      path: path.resolve(__dirname, '../../../../shell-ui-database/json/shell.json')
    });
    // 创建 shell 数据库初值
    if (!this.json.get('shell')) {
      this.json.set('shell', {});
      this.json.write();
    }

    this.createUUID = require('../../../utils/createUUID');
    this.shell = require('shelljs');
  }
}

module.exports = Base;
