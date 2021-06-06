const shell = require('shelljs');
const fs = require('fs');

module.exports = function (command) {
  // window 需要删除三个文件, sh 文件, cmd 文件, ps1 文件
  const fileType = [{ type: '', template: 'sh' }, { type: '.cmd', template: 'cmd' }, { type: '.ps1', template: 'ps1' }];

  [command.command, command.alias].forEach(cmd => {
    if (!cmd) return
    const path = shell.which(cmd).stdout
    fileType.forEach(item => {
      // todo 待确定 window 的 stdout 都是 .cmd 结尾的
      const tempPath = path.replace(/\.cmd$/g, item.template);
      if (fs.existsSync(tempPath)) {
        shell.rm('-r', tempPath);
      }
    })
  });
}
