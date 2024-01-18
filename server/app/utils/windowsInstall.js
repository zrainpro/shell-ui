const shell = require('shelljs');
const fs = require('../../../utils/fs');
const path = require('path')

module.exports = function (paths, command) {
  const p = paths.replace(/shell\.cmd$/g, '')
  // console.log(paths, p);
  // return
  // window 需要创建三个文件, sh 文件, cmd 文件, ps1 文件
  const fileType = [{ type: '', template: 'sh' }, { type: '.cmd', template: 'cmd' }, { type: '.ps1', template: 'ps1' }]
  fileType.forEach(item => {
    // 读取模板文件
    let shTemplate = fs.readFileSync(path.resolve(__dirname, `./template/${item.template}.template`)).toString();

    Array.from(new Set([command.command, command.alias])).forEach(cmd => {
      if (!cmd) return
      const tempPath = p + cmd + item.type;
      // 替换字符串模板
      shTemplate = shTemplate.replace(/\{\{command\}\}/g, cmd);
      if (fs.existsSync(tempPath)) {
        shell.rm('-r', tempPath);
      }
      fs.writeFileSync(tempPath, shTemplate);
    });
  })
}
