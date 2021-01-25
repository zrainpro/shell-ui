#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const shell = require('shelljs');
const packageInfo = require('../package.json');

program
  .version(packageInfo.version, '-v, --v, --version')


program.action(function(cmd, ...args) {
  const shellPath = path.resolve(__dirname, '../lib/shell.sh');
  shell
    .chmod('777', shellPath)
    .exec(shellPath + ' ' + path.resolve(__dirname, '../server/app/index.js'), null, function (code) {
      if (code !== 0) {
        shell.echo('程序执行出错, 请升级到最新版本呢!');
        shell.exit(1);
      }
    })
})
program.parse(process.argv);
