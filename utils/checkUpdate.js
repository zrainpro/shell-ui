const pacote = require('pacote');
const chalk = require('chalk');
const path = require('path');
const packageInfo = require('../package.json');
const JSON = require('./jsonDB');

const json = new JSON({
  path: path.resolve(__dirname, '../update.json')
});

module.exports = async function (version = 'latest') {
  let pkgInfo = null;
  if (json.get('version') && json.get('date') > (new Date() - 24 * 3600 * 1000)) {
    pkgInfo = json.get('version');
  } else {
    pkgInfo = await pacote.manifest(`${packageInfo.name}@${version}`, {
      defaultTag: version,
    }).catch(() => null);

    // 存储 版本信息
    json.set('version', pkgInfo);
    json.set('date', (new Date()).getTime());
    json.write();
  }

  const result = {
    hasUpdate: false,
    msg: ''
  }

  if (pkgInfo && pkgInfo.version !== packageInfo.version) {
    result.hasUpdate = true;
    result.msg = chalk.yellow(`检查到新版本 ${chalk.green(pkgInfo.version)} \n
您当前版本是: ${chalk.green(packageInfo.version)}, 为了保证您的使用体验, 尽快升级到最新版本呢\n
执行命令 ${chalk.green(`npm i -g shell-ui@${pkgInfo.version}`)}  来安装最新版本
    `);
  }
  return result;
}
