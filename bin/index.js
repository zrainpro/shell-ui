#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const shell = require('shelljs');
const packageInfo = require('../package.json');
const checkUpdate = require('../utils/checkUpdate');

(async function () {
  // 检查更新
  const result = await checkUpdate();
  if (result.hasUpdate) {
    console.log(result.msg);
  }

  program
    .version(packageInfo.version, '-v, --v, --version, version')


  program.action(function(cmd, ...args) {
    shell
      .chmod('777', shellPath)
      .exec('node ' + path.resolve(__dirname, '../server/app/index.js'), null, function (code) {
        if (code !== 0) {
          shell.echo('程序执行出错, 请升级到最新版本呢!');
          shell.exit(1);
        }
      })
  })
  program.parse(process.argv);
})()
