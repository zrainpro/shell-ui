'use strict';
const fs = require('fs');
const path = require('path');

// 创建所需的文件夹
if (!fs.existsSync(path.resolve(__dirname, '../../json'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../json'))
}
// 创建 lib 文件夹
if (!fs.existsSync(path.resolve(__dirname, '../../lib'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../lib'));
}
// 创建用户脚本存放文件夹
if (!fs.existsSync(path.resolve(__dirname, '../../lib/userShell'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../lib/userShell'))
}
// 创建 js 脚本存放目录
if (!fs.existsSync(path.resolve(__dirname, '../../lib/userScript'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../lib/userScript'))
}
