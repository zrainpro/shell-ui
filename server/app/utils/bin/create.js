// 创建指令
const fs = require('../../../../utils/fs');
const path = require('path');
const { buildShell } = require('./package');
const { fileType, homePath } = require('./config');

async function createInstruct({ _this, params, useId }) {
    const { json, createUUID, shell } = _this;

    let uuid = useId && params.id ? params.id : createUUID();
    const data = {
        parent: 'root',
        type: 'shell',
        ...params,
        id: uuid,
        enable: true
    };
    let error = '';
    // 进行必要字段判空
    (['command', 'shell']).find(key => {
        if (!data[key]) {
            error = `${key} can not be empty`;
            return true
        }
    });
    // 禁止创建 shell 子脚本
    if (data.parent === 'shell') {
        error = '不能在 shell 下创建脚本呢!';
    }
    // 如果存在错误直接返回错误
    if (error) return { error };

    // 如果存在 parent 添加到 parent 的子命令中
    if (data.parent !== 'root') {
        let parent = json.get('shell')[data.parent];
        if (!parent) {
            parent = {
                id: createUUID(),
                enable: true,
                command: data.parent,
                alias: '',
                type: 'shell',
                description: '没错, 本脚本帮你建的脚本',
                shell: 'echo 帮你自动设置了命令,不知道执行点什么,输出一个✨吧',
                children: []
            }
            // 判断指令是否存在
            if (shell.which(parent.command)) {
                return { error: `父指令 ${parent.command} 已经存在!` }
            }
            json.get('shell')[data.parent] = parent;
            await buildShell(parent); // 创建父级 js 脚本 与 shell 脚本与子脚本存放目录, 更新 package 文件重新 npm link
        }
        // 进行子指令去重
        if (parent.children.find(_ => _.command === data.command)) {
            return { error: `子指令 ${data.command} 已经存在!` };
        }
        parent.children.push({
            command: data.command || '',
            alias: data.alias || '',
            type: data.type || 'shell',
            description: data.description || '',
            shell: data.shell || '',
            enable: true,
            id: data.id,
            parent: parent.command
        });
        // 如果 脚本类型是 shell 脚本, 创建子脚本的 sh 可执行文件
        if (fileType[data.type]) {
            fs.writeFileSync(path.resolve(homePath, `./.shell-ui/lib/userShell/${parent.command}/${data.command}.${fileType[data.type]}`), data.shell);
        }
        // 设置完数据保存到文件
        json.write();
        return { pass: true };
    } else {
        const shellInfo = {
            command: data.command || '',
            alias: data.alias || '',
            type: data.type || 'shell',
            description: data.description || '',
            shell: data.shell || '',
            id: data.id,
            enable: true,
            children: []
        };
        // 判断指令是否存在
        if (shell.which(shellInfo.command)) {
            return { error: `指令 ${shellInfo.command} 已经存在!` };
        }
        if (shellInfo.alias !== shellInfo.command && shellInfo.alias && shell.which(shellInfo.alias)) {
            return { error: `指令简写 ${shellInfo.alias} 已经存在!` };
        }
        json.get('shell')[shellInfo.command] = shellInfo;
        json.write();
        await buildShell(shellInfo); // 创建父级 js 脚本 与 shell 脚本与子脚本存放目录, 更新 package 文件重新 npm link
        return { uuid, pass: true };
    }
}

module.exports = createInstruct