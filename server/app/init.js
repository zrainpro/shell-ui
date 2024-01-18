'use strict';
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const { homedir } = require('os');
const JSONDB = require('../../utils/jsonDB');
const fse = require('fs-extra');

module.exports = function () {
  return new Promise(resolve => {
    // - 默认使用 $home/.shell-ui/shell.json 同时兼容之前的设置
    const databasePath = path.resolve(homedir(), './.shell-ui');
    const oldPath = path.resolve(__dirname, '../../../shell-ui-database');
    if (!fs.existsSync(databasePath) && fs.existsSync(oldPath)) {
      fse.copySync(oldPath, databasePath);
      return resolve(0);
    }
    // 初始化一个本地数据库, 用于存放是否初始化完成, 以及以后相关依赖安装情况
    const json = new JSONDB({
      path: path.resolve(__dirname, '../../status.json')
    });
    // 创建 shell 数据库初值
    if (!json.get('init')) {
      json.set('init', {
        packageInit: false, // 是否安装了 .shell-ui 的依赖
      });
      json.write();
    }
    // 如果已经初始化完成, 不再进行后续
    if (json.get('init.packageInit', false) && fs.existsSync(databasePath)) {
      return resolve(0);
    }

    // 创建所需的文件夹
    if (!fs.existsSync(databasePath)) {
      // 创建数据文件夹
      fs.mkdirSync(databasePath);
    }

    /**
     * 构建所需要的依赖, 目前是 commander shelljs
     * 复制 json 文件到目标文件夹
     * 每次都更新一下 package.json 防止旧版本没有更新依赖出现问题
     */
    shell.cp('-R', path.resolve(__dirname, './utils/database.json'), path.resolve(databasePath, './package.json'));

    if (!fs.existsSync(path.resolve(databasePath, './json'))) {
      fs.mkdirSync(path.resolve(databasePath, './json'))
    }
    // 创建 lib 文件夹
    if (!fs.existsSync(path.resolve(databasePath, './lib'))) {
      fs.mkdirSync(path.resolve(databasePath, './lib'));
    }
    // 创建用户脚本存放文件夹
    if (!fs.existsSync(path.resolve(databasePath, './lib/userShell'))) {
      fs.mkdirSync(path.resolve(databasePath, './lib/userShell'))
    }
    // 创建 js 脚本存放目录
    if (!fs.existsSync(path.resolve(databasePath, './lib/userScript'))) {
      fs.mkdirSync(path.resolve(databasePath, './lib/userScript'))
    }
    // 安装依赖
    if (!json.get('init.packageInit', false) || !fs.existsSync(path.resolve(databasePath, './node_modules'))) {
      // 安装所需的依赖
      console.log('正在初始化项目, 请稍等...');
      console.log('项目未初始化完成不要退出哦, 否则可能会无法正常使用哦')
      const currentDir = path.resolve('./');
      shell.cd(databasePath);
      shell.exec(`npm i --registry=https://mirrors.cloud.tencent.com/npm/`, null, function (code) {
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
        // 安装完依赖了在 .shell-ui 中创建一个已经安装完依赖的文件, 所有shell 命令都会先检测这个, 如果没有安装依赖, 会先安装依赖防止报错
        const markInit = new JSONDB({
          path: path.resolve(databasePath, './init.json')
        });
        if (!markInit.get('init', false)) {
          markInit.set('init', true);
        }
        markInit.write().destroy();
        markInit.destroy();
        resolve(code);
      });
    } else {
      resolve(1);
    }
  });
}
