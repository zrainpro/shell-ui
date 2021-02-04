'use strict';
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

// 创建所需的文件夹
if (!fs.existsSync(path.resolve(__dirname, '../../../shell-ui-database'))) {
  const dir = path.resolve(__dirname, '../../../shell-ui-database')
  // 创建数据文件夹
  fs.mkdirSync(dir);
  // 构建所需要的依赖, 目前是 commander shelljs
  // 复制 json 文件到目标文件夹
  shell.cp('-R', path.resolve(__dirname, './utils/database.json'), path.resolve(dir, './package.json'))
  // 安装所需的依赖
  console.log('正在初始化项目, 请稍等...');
  const currentDir = path.resolve('./');
  shell.cd(dir);
  shell.exec(`npm i ${dir} --registry=https://registry.npm.taobao.org`, null, function (code) {
    shell.cd(currentDir);
    console.log('初始化依赖完成')
    if (code !== 0) {
      shell.echo('初始化失败,请检查网络后重试!');
      shell.exit(1);
    }
  })
}
if (!fs.existsSync(path.resolve(__dirname, '../../../shell-ui-database/json'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../../shell-ui-database/json'))
}
// 创建 lib 文件夹
if (!fs.existsSync(path.resolve(__dirname, '../../../shell-ui-database/lib'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../../shell-ui-database/lib'));
}
// 创建用户脚本存放文件夹
if (!fs.existsSync(path.resolve(__dirname, '../../../shell-ui-database/lib/userShell'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../../shell-ui-database/lib/userShell'))
}
// 创建 js 脚本存放目录
if (!fs.existsSync(path.resolve(__dirname, '../../../shell-ui-database/lib/userScript'))) {
  fs.mkdirSync(path.resolve(__dirname, '../../../shell-ui-database/lib/userScript'))
}
