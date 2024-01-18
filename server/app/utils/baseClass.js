'use strict';
const JSONDB = require('../../../utils/jsonDB');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { homedir } = require('os');

class Base {
  constructor(props) {
    this.JSONDB = JSONDB;
    // 创建 shell 脚本存放数据库 - 默认使用 $home/.shell-ui/shell.json 同时兼容之前的设置
    const homePath = path.resolve(homedir(), '.shell-ui');
    const oldPath = path.resolve(__dirname, '../../../../shell-ui-database');
    if (!fs.existsSync(homePath) && fs.existsSync(oldPath)) {
      fse.copySync(oldPath, homePath);
    }
    this.json = new JSONDB({
      path: path.resolve(homePath, './json/shell.json')
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
