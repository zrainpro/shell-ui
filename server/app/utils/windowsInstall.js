const shell = require('shelljs');
const fs = require('fs');
const path = require('path')

module.exports = function (paths, command) {
  const p = paths.replace(/shell\.cmd$/g, '')
  // console.log(paths, p);
  // return
  // window 需要创建三个文件, sh 文件, cmd 文件, ps1 文件
  const fileType = [{ type: '', template: 'sh' }, { type: '.cmd', template: 'cmd' }, { type: '.ps1', template: 'ps1' }]
  fileType.forEach(item => {
    const tPath = p + command.command + item.type;
    // 读取模板文件
    let shTemplate = fs.readFileSync(path.resolve(__dirname, `./template/${item.template}.template`)).toString();
    // 替换字符串模板
    shTemplate = shTemplate.replace(/\{\{command\}\}/g, command.command);
    if (fs.existsSync(tPath)) {
      shell.rm('-r', tPath);
    }
    fs.writeFileSync(tPath, shTemplate);
  })
}
