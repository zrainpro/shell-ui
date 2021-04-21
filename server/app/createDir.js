'use strict';
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const JSONDB = require('../../utils/jsonDB');

// 初始化一个本地数据库, 用于存放是否初始化完成, 以及以后相关依赖安装情况
const json = new JSONDB({
  path: path.resolve(__dirname, '../../status.json')
});
// 创建 shell 数据库初值
if (!json.get('init')) {
  json.set('init', {
    packageInit: false, // 是否安装了 shell-ui-database 的依赖
  });
  json.write();
}

const dir = path.resolve(__dirname, '../../../shell-ui-database')
// 创建所需的文件夹
if (!fs.existsSync(dir)) {
  // 创建数据文件夹
  fs.mkdirSync(dir);
  // 构建所需要的依赖, 目前是 commander shelljs
  // 复制 json 文件到目标文件夹
  shell.cp('-R', path.resolve(__dirname, './utils/database.json'), path.resolve(dir, './package.json'))
}
// 安装依赖
if (!json.get('init').packageInit) {
  // 安装所需的依赖
  console.log('正在初始化项目, 请稍等...');
  console.log('项目未初始化完成不要退出哦, 否则可能会无法正常使用哦')
  const currentDir = path.resolve('./');
  shell.cd(dir);
  shell.exec(`npm i ${dir} --registry=https://registry.npm.taobao.org`, null, function (code) {
    shell.cd(currentDir);
    if (code !== 0) {
      shell.echo('初始化失败,请检查网络后重试!');
      shell.exit(1);
    } else {
      console.log('初始化依赖完成');
      json.set('init', {
        ...json.get('init'),
        packageInit: true
      });
      json.write();
    }
  })
}
if (!fs.existsSync(path.resolve(dir, './json'))) {
  fs.mkdirSync(path.resolve(dir, './json'))
}
// 创建 lib 文件夹
if (!fs.existsSync(path.resolve(dir, './lib'))) {
  fs.mkdirSync(path.resolve(dir, './lib'));
}
// 创建用户脚本存放文件夹
if (!fs.existsSync(path.resolve(dir, './lib/userShell'))) {
  fs.mkdirSync(path.resolve(dir, './lib/userShell'))
}
// 创建 js 脚本存放目录
if (!fs.existsSync(path.resolve(dir, './lib/userScript'))) {
  fs.mkdirSync(path.resolve(dir, './lib/userScript'))
}
