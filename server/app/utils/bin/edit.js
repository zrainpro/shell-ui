// 修改指令
const { buildShell, deletePackageShell, deletePackage, reLoadPackage } = require("./package");
const fs = require("../../../../utils/fs");
const path = require("path");
const { fileType, homePath } = require('./config');

async function editInstruct({ _this, params }) {
    const { json, shell, createUUID } = _this;
    const data = {
        parent: 'root',
        type: 'shell',
        ...params
    };
    let error = ''; // 错误信息
    // 进行必要字段判空
    (['command', 'shell']).find(key => {
        if (!data[key]) {
            error = `${key} can not be empty`;
            return true;
        }
    });
    // 禁止修改 shell 脚本
    if (
        (data.command === 'shell' && data.parent === 'root') || // 禁止修改 shell 脚本
        (data.parent === 'shell') // 禁止修改 shell 子脚本
    ) {
        error = 'shell 脚本禁止修改的呢';
    }
    if (error) return { error };
    // 进行修改, 如果修改父指令那么就需要更新脚本, 如果修改子指令, 直接修改数据即可
    if (data.parent === 'root') {
        // 如果是子指令改为 根指令
        if (data.oldParent) {
            // 先判断指令是否存在
            if (shell.which(data.command)) {
                return { error: `您不能将当前子指令更改为根指令哦, 因为 ${data.command} 已经存在了哦!` };
            }
            if (data.alias !== data.command && data.alias && shell.which(data.alias)) {
                return { error: `指令简写 ${data.alias} 已经存在!` };
            }
            // 创建新的根指令的数据
            json.set(`shell.${data.command}`, {
                command: data.command || '',
                alias: data.alias || '',
                type: data.type || 'shell',
                description: data.description || '',
                shell: data.shell || '',
                id: data.id,
                enable: true,
                nodeModule: [],
                children: []
            });
            // 删除旧的根指令中的当前指令
            const oldCommand = json.get(`shell.${data.oldParent}`);
            if (oldCommand) {
                oldCommand.children = oldCommand.children.filter(item => item.id !== data.id);
            }
            json.write();
            // 创建指令
            await buildShell(data);
        } else { // 正常的修改根指令
            // 先拿到旧的指令
            const shellData = json.get('shell');
            const oldCommand = Object.keys(shellData).map(_ => shellData[_]).find(item => item.id === data.id);
            // 如果旧指令不存在
            if (!oldCommand) {
                return { error: '您要修改的数据不存在, 请返回上一级重新操作!' };
            }
            // 如果修改了指令名, 那么需要修改指令
            if (oldCommand.command !== data.command) {
                // 判断新指令是否存在
                if (shell.which(data.command)) {
                    return { error: `指令 ${data.command} 已经存在` };
                }
                // 删除旧的指令, 创建的脚本, 创建的子脚本 并更新到 package.json
                await deletePackageShell(oldCommand);
                // 删除旧的指令数据
                json.delete(`shell.${oldCommand.command}`);
                // 创建新的数据
                json.set(`shell.${data.command}`, oldCommand);
                // 创建了新的指令, 那么需要更新 shell 脚本
                await buildShell(data);
                // 创建子脚本 并 同步子脚本 parent 字段
                oldCommand.children.forEach(item => {
                    item.parent = data.command;
                    if (fileType[item.type]) {
                        fs.writeFileSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${data.command}/${item.command}.${fileType[item.type]}`), item.shell)
                    }
                });
            }
            // 如果修改了指令简写, 那么要删除之前旧的指令简写, 并且创建新的指令简写
            if (oldCommand.alias !== data.alias) {
                // 判断新的指令简写是否存在
                if (data.alias !== data.command && data.alias && shell.which(data.alias)) {
                    return { error: `指令简写 ${data.alias} 已经存在!` };
                }
                // 删除旧的指令软链数据, 写入新的软链
                deletePackage(oldCommand);
                await reLoadPackage(data);
            }
            // 更新指令数据
            json.set(`shell.${data.command}`, {
                ...oldCommand,
                command: data.command,
                alias: data.alias,
                description: data.description || '',
                type: data.type || 'shell',
                shell: data.shell || ''
            });
            // 如果更新了 shell 脚本, 那么需要重新写入 对应的脚本文件, 修改了脚本类型应该删除之前的脚本
            if (((oldCommand.shell !== data.shell) || (oldCommand.type !== data.type)) && fileType[data.type]) {
                // 如果脚本类型发生了变化应该删除之前的脚本
                const oldPath = path.resolve(homePath, `./.shell-ui/lib/userShell/${oldCommand.command}.${fileType[oldCommand.type]}`);
                if (oldCommand.type !== data.type && fs.existsSync(oldPath)) {
                    shell.rm('-r', oldPath);
                }
                fs.writeFileSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${data.command}.${fileType[data.type]}`), data.shell);
            }
            // 然后写入数据
            json.write();
        }
    } else {
        // 先判断是否是父指令更改为子指令, 因为会丢失子指令, 所以暂时禁止
        if (!data.oldParent) {
            return { error: '暂时不支持将根指令转为子指令呢!!!' };
        }
        // 判断子指令是否修改了父指令
        if (data.parent !== data.oldParent) {
            // 先 删除旧的父指令中的该子指令
            const oldParentCommand = json.get(`shell.${data.oldParent}`);
            let oldItm = null; // 要修改的指令
            if (oldParentCommand) {
                oldParentCommand.children = oldParentCommand.children.filter(item => item.id !== data.id);
                oldItm = oldParentCommand.children.find(item => item.id === data.id);
                if (oldItm && fileType[oldItm.type]) {
                    // 删除旧的子 shell 脚本
                    shell.rm('-f', path.resolve(homePath, `./.shell-ui/lib/userShell/${oldParentCommand.command}/${oldItm.command}.${fileType[oldItm.type]}`));
                }
            }
            // 在将新的子指令写入对应的父指令
            const parentCommand = json.get(`shell.${data.parent}`);
            if (!parentCommand) {
                return { error: `您选择的父指令 "${data.parent}" 似乎不存在呢, 是不是那个小伙伴给删除了呢...` };
            }
            parentCommand.children.push({
                parent: data.parent,
                command: data.command,
                alias: data.alias,
                description: data.description || '',
                type: data.type || 'shell',
                shell: data.shell || '',
                enable: oldItm ? oldItm.enable : true,
                id: data.id || createUUID()
            });
            // 如果是 shell 删除旧的文件夹中的 shell 脚本, 并创建新的脚本
            if (fileType[data.type]) {
                fs.writeFileSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${parentCommand.command}/${data.command}.${fileType[data.type]}`), data.shell || '');
            }
            // 保存到 json
            json.write();
        } else {
            // 只是简单的修改了子指令的值
            const parent = json.get(`shell.${data.parent}`);
            const oldCommand = parent.children.find(item => item.id === data.id);
            if (!oldCommand) {
                return { error: '找不到您要修改的指令呢.... 请返回上一级刷新最新的数据呢....' }
            }
            // 如果修改了子指令的 command 或者 type 需要删除旧的脚本文件
            if (oldCommand.command !== data.command || oldCommand.type !== data.type) {
                // 删除旧的子指令
                shell.rm('-f', path.resolve(homePath, `./.shell-ui/lib/userShell/${parent.command}/${oldCommand.command}.${fileType[oldCommand.type]}`));
            }
            // type 类型修改-删除旧的指令
            oldCommand.command = data.command;
            oldCommand.alias = data.alias;
            oldCommand.description = data.description || '';
            oldCommand.type = data.type || 'shell';
            oldCommand.shell = data.shell || '';
            // 如果新的子指令是 shell 类型的, 创建新的子 shell 脚本
            if (fileType[oldCommand.type]) {
                fs.writeFileSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${parent.command}/${oldCommand.command}.${fileType[oldCommand.type]}`), oldCommand.shell);
            }
            json.write();
        }
    }
    return { success: true, data: params };
}

module.exports = editInstruct;