#!/usr/bin/env node
const program = require('commander');
const packageInfo = require('../package.json');
const initProject = require('../server/app/init');
const checkUpdate = require('../utils/checkUpdate');
const config = require('../lib/config');

(async function () {
  // 初始化
  await initProject();
  const runApp = require('../server/app/index');
  // 检查更新
  const result = await checkUpdate();
  if (result.hasUpdate) {
    console.log(result.msg);
  }

  program
    .version(packageInfo.version, '-v, --v, --version, version')
    .option('-p --port [type]', '指定运行端口')
    .option('-h --helps', '帮助文档说明')

  config.forEach(item => {
    let temp = program;
    Object.entries(item).forEach(([key, value]) => {
      if (key === 'options') {
        value.forEach(({ dir, desc }) => {
          temp = temp.option(dir, desc);
        });
      } else {
        temp = temp[key](value);
      }
    });
  });

  program.action(function(options, cmd) {
    if (options.helps) {
      program.help();
    } else {
      const [ command ] = cmd.args;
      if (!command || command === 'start') {
        runApp(options.port);
      } else {
        program.help();
      }
    }
  });
  program.parse(process.argv);
})()
