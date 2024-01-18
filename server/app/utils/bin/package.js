const path = require("path");
const fs = require("../../../../utils/fs");
const shell = require("shelljs");
const { fileType, rootPath, homePath } = require('./config');
const windowInstall = require("../windowsInstall");
const windowUnInstall = require("../windowuninstall");

const JSONDB = require(path.resolve(rootPath, './utils/jsonDB'));

/**
 * 删除指令
 * @param command
 * @returns {Promise<unknown>}
 */
function deletePackageShell(command) {
    return new Promise(resolve => {
        // 删除指令的软链接并在 package 中移出对应指令
        deletePackage(command);
        // 删除创建的 js 文件
        shell.rm('-f', path.resolve(homePath, `./.shell-ui/lib/userScript/${command.command}.js`));
        // 如果之前是 shell 类型的, 应该删除掉对应创建的 shell 脚本
        if (fileType[command.type]) {
            shell.rm('-f', path.resolve(homePath, `./.shell-ui/lib/userShell/${command.command}.${fileType[command.type]}`));
        }
        // 删除之前的 shell 子脚本
        shell.rm('-rf', path.resolve(homePath, `./.shell-ui/lib/userShell/${command.command}`));
        resolve()
    })
}
/**
 * 删除指令的软链接, 并移出 package 中的对应的指令
 * @param command
 */
function deletePackage(command) {
    // 引入 package.json
    const packageJson = new JSONDB({
        path: path.resolve(rootPath, './package.json')
    });
    // 删除 command 的指令并保存
    packageJson.delete(`bin.${command.command}`)
    command.alias && packageJson.delete(`bin.${command.alias}`);
    packageJson.write().destroy();
    // 删除软链接
    if (process.platform === 'win32') {
        windowUnInstall(command);
    } else {
        Array.from(new Set([command.command, command.alias])).forEach(cmd => {
            if (!cmd) return;
            // 删除指令数据
            if (shell.which(cmd)) {
                shell.rm('-f', shell.which(cmd).stdout);
            }
        });
    }
}

/**
 * 创建父指令, 以及相关处理
 * @param command
 * @returns {Promise<void>}
 */
async function buildShell(command) {
    // 读取模板文件
    let template = fs.readFileSync(path.resolve(rootPath, './bin/script.template')).toString();
    console.log('已经读取模版文件')
    // 替换字符串模板
    template = template.replace(/`\{\{command\}\}`/g, command.command);
    template = template.replace(/`'\{\{command\}\}'`/g, `'${command.command}'`);
    // 创建父级 js 脚本
    fs.writeFileSync(path.resolve(homePath, `./.shell-ui/lib/userScript/${command.command}.js`), template);
    // 如果父脚本是 shell 类型的, 创建父脚本的 sh 文件
    if (fileType[command.type]) {
        fs.writeFileSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${command.command}.${fileType[command.type]}`), command.shell);
    }
    // 创建子脚本的存放目录
    if (!fs.existsSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${command.command}`))) {
        fs.mkdirSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${command.command}`));
    }
    // 更新 package 文件重新 npm link
    await reLoadPackage(command);
}

/**
 * 更新 package 依赖并重新 link
 * @param command
 * @returns {Promise<unknown>}
 */
function reLoadPackage (command) {
    return new Promise((resolve) => {
        // 引入 package.json
        const packageJson = new JSONDB({
            path: path.resolve(rootPath, './package.json')
        });
        packageJson.get('bin')[command.command] = path.resolve(homePath, `./.shell-ui/lib/userScript/${command.command}.js`);
        command.alias && (packageJson.get('bin')[command.alias] = packageJson.get('bin')[command.command]);
        packageJson.write();
        packageJson.destroy();
        if (shell.which('shell')) {
            const paths = shell.which('shell').stdout.toLowerCase();
            // 判断系统
            if (process.platform === 'win32') {
                windowInstall(paths, command)
            } else {
                // 链接文件
                Array.from(new Set([command.command, command.alias])).forEach(cmd => {
                    if (!cmd) return
                    const tempPath = paths.replace(/[\\\/]shell$/g, `/${cmd}`);
                    // 如果之前存在软链接, 需要删除软链接防止创建软链接失败
                    if (fs.existsSync(tempPath) && fs.lstatSync(tempPath).isSymbolicLink(tempPath)) {
                        shell.rm('-r', tempPath);
                    }
                    fs.symlinkSync(path.resolve(homePath, `./.shell-ui/lib/userScript/${command.command}.js`), tempPath);
                    shell.chmod('777', tempPath); // 程序可执行
                });
            }

            resolve();
        } else {
            return
        }
    })
}

module.exports = {
    reLoadPackage,
    buildShell,
    deletePackage,
    deletePackageShell
}