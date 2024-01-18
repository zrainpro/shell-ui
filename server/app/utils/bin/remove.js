const path = require("path");
const { deletePackageShell } = require("./package");
const { homePath } = require('./config');

/**
 * 删除指令
 * @param _this
 * @param params
 * @returns {Promise<{error: string}|{pass: boolean, command: string | undefined | null, message: string | undefined}>}
 */
async function removeInstruct({ _this, params }) {
    const { json, shell } = _this;
    const shellData = json.get('shell');
    // 先获取到要删除的脚本, 先判断要删除的脚本是不是根指令
    let command = null;
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
        return { pass: true, message: `这个指令早就被删除了` }
    }
    // 删除父脚本的要同时删除子脚本, 删除可执行指令, 删除 package.json 中的值
    if (!command.parent) {
        // 删除父脚本
        await deletePackageShell(command);
        // 删除父脚本数据
        json.delete(`shell.${command.command}`);
        json.write();
    } else {
        // 删除子脚本的要同时删除 shell 子脚本文件
        if (command.type === 'shell') {
            shell.rm('-f', path.resolve(homePath, `./.shell-ui/lib/userShell/${command.parent}/${command.command}.sh`));
        }
        // 删除子脚本数据
        const parent = shellData[command.parent];
        if (parent) {
            parent.children = parent.children.filter(item => item.id !== command.id);
            json.write();
        }
    }
    return { pass: true, command };
}

module.exports = removeInstruct;