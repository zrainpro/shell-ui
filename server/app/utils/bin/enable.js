const path = require('path');
const fs = require('fs');
const { buildShell } = require('./package');
const { rootPath } = require('./config');

/**
 * 启用禁用某个指令
 * @param _this
 * @param params
 * @returns {Promise<{error: string}|{pass: boolean, command: null}>}
 */
async function enableInstruct({ _this, params }) {
    const { json, shell, JSONDB } = _this;
    // 首选找到脚本
    const shellData = json.get('shell');
    // 先获取到要删除的脚本, 先判断要删除的脚本是不是根指令
    let command = null;
    let error = '';
    Object.keys(shellData).find(key => {
        const item = shellData[key];
        if (item.id === params.id) {
            command = item;
            return true;
        }
        for (let childItem of item.children) {
            if (childItem.id === params.id) {
                command = childItem;
                return true;
            }
        }
        return false
    });
    if (!command) {
        return { error: `您要操作的指令 ${params.command} 不存在呢!` };
    }
    // 引入 package.json
    const packageJson = new JSONDB({
        path: path.resolve(rootPath, './package.json')
    });
    // 如果是启用根脚本, 重新创建可执行脚本与子脚本
    // 如果是禁用根脚本, 删除可执行脚本与子脚本
    if (!command.parent) {
        if (params.enable) {
            if (shell.which(command.command)) {
                return { error: `指令 ${command.command} 已经存在, 请换个名字在重试呢` }
            }
            await buildShell(command); // 创建可执行脚本
            // 创建子脚本
            if (command.children && command.children.length) {
                command.children.forEach(item => {
                    if (item.type === 'shell') {
                        fs.writeFileSync(path.resolve(rootPath, `../shell-ui-database/lib/userShell/${command.command}/${item.command}.sh`), item.shell)
                    }
                });
            }
        } else {
            // 删除 command 的指令并保存
            packageJson.delete(`bin.${command.command}`).write();
            packageJson.destroy();
            // 删除指令数据
            if (shell.which(command.command)) {
                shell.rm('-f', shell.which(command.command).stdout);
            }
        }
        // 修改数据
        command.enable = !!params.enable;
    } else {
        command.enable = !!params.enable;
    }
    json.write();
    return { pass: true, command };
}

module.exports = enableInstruct;