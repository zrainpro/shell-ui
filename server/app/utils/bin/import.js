const path = require('path');
const inquirer = require('inquirer');
const createInstruct = require('./create');
const editInstruct = require('./edit');
const { rootPath } = require('./config');

/**
 * 导入指令
 * @param _this
 * @param json
 * @param onRepeat
 * @param onAliasRepeat
 * @returns {Promise<{successRoot: number, failChildData: *[], failRootData: *[], ignoreChildData: *[], failRoot: number, ignoreRootData: *[], failChild: number, ignoreChild: number, ignoreRoot: number}>}
 */
async function importInstruct({ _this, json, onRepeat = '', onAliasRepeat = '' }) {
    // 创建指令, 如果 id 存在,修改 ID 并进行创建(相当于合并操作), 如果指令存在, 修改指令,
    const errors = []; // 记录数据错误, 创建失败等指令, 根指令
    const errorsChild = []; // 记录子指令出现错误的数据
    const ignores = []; // 记录用户手动忽略的数据, 只记录根指令
    const ignoreChild = []; // 记录用户手动忽略的子指令数据
    // 获取目前已经存在的指令
    let currentInstruct = require(path.resolve(rootPath, '../shell-ui-database/json/shell.json'));
    currentInstruct = currentInstruct.shell || {};

    // todo 解耦逻辑, 抽离 utils 处理逻辑
    function ask_user(command, root = true) {
        return inquirer.prompt([
            {
                type: 'list',
                name: 'repeat',
                message: `${root ? '根' : '子'}指令 ${command.command} 已经存在,请问要怎么处理呢?`,
                choices: root ? [
                    { name: '合并(编辑)', value: 'merge' },
                    { name: '忽略(不导入这条指令)', value: 'ignore' },
                    { name: '新建(指令后追加 _repeat 然后新建指令)', value: 'add' },
                    { name: '全部合并(注意:之后的根指令以及子指令如果重复也都将进行合并处理,请谨慎选择)', value: 'merge_all' },
                    { name: '全部忽略(注意:之后的根指令以及子指令如果重复也都会忽略不导入,请谨慎选择)', value: 'ignore_all' },
                    { name: '全部新建(注意:之后的根指令以及子指令如果重复也都将进行新建处理,请谨慎选择)', value: 'add_all' }
                ] : [
                    { name: '合并(编辑)', value: 'merge' },
                    { name: '忽略(不导入这条指令)', value: 'ignore' },
                    { name: '新建(指令后追加 _repeat 然后新建指令)', value: 'add' },
                    { name: '全部合并(只针对当前根指令的重复的子指令)', value: 'merge_all' },
                    { name: '全部忽略(只针对当前根指令的重复子指令)', value: 'ignore_all' },
                    { name: '全部新建(只针对当前根指令的重复子指令)', value: 'add_all' }
                ]
            }
        ])
    }
    function ask_user_alias(command, root = true) {
        return inquirer.prompt([
            {
                type: 'list',
                name: 'repeat',
                message: `${root ? '根' : '子'}指令 ${command.command} 的指令简写 ${command.alias} 已经存在, 请问要怎么处理呢?`,
                choices: root ? [
                    { name: '忽略(不导入这条指令)', value: 'ignore' },
                    { name: '新建(指令后追加 _alias_repeat 然后新建指令)', value: 'add' },
                    { name: '全部忽略(注意:之后的根指令以及子指令如果重复也都会忽略不导入,请谨慎选择)', value: 'ignore_all' },
                    { name: '全部新建(注意:之后的根指令以及子指令如果重复也都将进行新建处理,请谨慎选择)', value: 'add_all' }
                ] : [
                    { name: '忽略(不导入这条指令)', value: 'ignore' },
                    { name: '新建(指令后追加 _alias_repeat 然后新建指令)', value: 'add' },
                    { name: '全部忽略(只针对当前根指令的重复子指令)', value: 'ignore_all' },
                    { name: '全部新建(只针对当前根指令的重复子指令)', value: 'add_all' }
                ]
            }
        ])
    }
    // 抽离指令合并处理逻辑
    async function detail_merge (command, globalChoose, globalAliasChoose, currentInstruct, root) {
        let itemChoose = globalChoose, oldCommand = null, suffix = ''; // suffix 追加的后缀, itemChoose 指令处理方式 add|edit|ignore
        const currentInstructArr = Object.keys(currentInstruct).map(_ => currentInstruct[_]); // 现有的指令的数组结构
        if (currentInstruct[command.command]) {
            // 存在与否, 无论存在与否都会询问, 无需特殊处理 todo _repeat 并不能保证不重复, 应该采用 md5 后缀
            if (!globalChoose) {
                const userChoose = await ask_user(command, root);
                switch (userChoose.repeat) {
                    case 'merge': itemChoose = 'merge'; oldCommand = currentInstruct[command.command]; break;
                    case 'add': itemChoose = 'add'; break;
                    case 'ignore': itemChoose = 'ignore'; break;
                    case 'merge_all': globalChoose = 'merge'; itemChoose = 'merge'; break;
                    case 'add_all': globalChoose = 'add'; itemChoose = 'add'; break;
                    case 'ignore_all': globalChoose = 'ignore'; itemChoose = 'ignore'; break;
                }
            }
            suffix = itemChoose === 'add' ? '_repeat' : '';
        } else if (currentInstruct[command.alias]) {
            // 走到这里 command 必然不会重复, 直接询问即可
            if (!globalAliasChoose) {
                const userChoose = await ask_user_alias(command, root);
                switch (userChoose.repeat) {
                    case 'ignore': itemChoose = 'ignore'; break;
                    case 'add': itemChoose = 'add'; break;
                    case 'ignore_all': globalAliasChoose = 'ignore'; itemChoose = 'ignore'; break;
                    case 'add_all': globalAliasChoose = 'add'; itemChoose = 'add'; break
                }
            } else {
                itemChoose = globalAliasChoose;
            }
            suffix = itemChoose === 'add' ? '_alias_repeat' : '';
        } else {
            // 找出是否与 alias 重复
            if (currentInstructArr.find(_ => _.alias === command.command || _.alias === command.alias)) {
                if (!globalAliasChoose) {
                    const userChoose = await ask_user_alias(command, root);
                    switch (userChoose.repeat) {
                        case 'ignore': itemChoose = 'ignore'; break;
                        case 'add': itemChoose = 'add'; break;
                        case 'ignore_all': globalAliasChoose = 'ignore'; itemChoose = 'ignore'; break;
                        case 'add_all': globalAliasChoose = 'add'; itemChoose = 'add'; break
                    }
                } else {
                    itemChoose = globalAliasChoose
                }
                suffix = itemChoose === 'add' ? '_alias_exist' : '';
            } else {
                // 没有重复, 完全新建
                itemChoose = 'add';
            }
        }
        let result = {};
        // 写入根指令
        switch (itemChoose) {
            case 'merge':
                // 编辑要把 id 修改为旧的相同指令的 id , 不然无法编辑
                if (oldCommand) command.id = oldCommand.id;
                result = await editInstruct({ _this, params: command });
                break;
            case 'add':
                // 判断 ID 是否存在, ID 如果已经存在那么修改一下 ID 在进行创建
                if (Object.keys(currentInstruct).find(key => currentInstruct[key].id === command.id)) {
                    command.id = _this.createUUID();
                }
                // 重新改指令名
                if (suffix) {
                    command.command += suffix;
                    command.alias += suffix;
                }
                result = await createInstruct({ _this, params: command, useId: true });
                break;
            case 'ignore':
                result = { ignore: true };
                break;
        }
        return { globalChoose, globalAliasChoose, result, itemChoose, suffix }
    }

    let globalChoose = onRepeat, globalAliasChoose = onAliasRepeat;
    // 如果与现有指令冲突, 追加 _repeat 来标记冲突项, 让用户自己去处理
    for (let item of json) {
        /** 筛选出来不存在的执行新建命令
         *  筛选出来存在的根指令, 询问如何操作, 提供 合并(编辑) 新建(追加_repeat 后缀) 全部合并 与 全部新建命令
         *  然后筛选出来对应的子指令, 重复的询问操作, 提供 合并(编辑) 新建(追加_repeat 后缀) 全部合并(只针对当前根指令的子指令) 全部新建(同左边)
         */
        const detailData = await detail_merge(item, globalChoose, globalAliasChoose, currentInstruct, true);
        // 形参不能改变原数据, 修改存储的原数据
        globalChoose = detailData.globalChoose;
        globalAliasChoose = detailData.globalAliasChoose;

        // 如果出错展示记录错误信息
        if (detailData.result.error) {
            errors.push({
                root: true,
                error: detailData.result.error,
                command: item.command,
                id: item.id,
                instruct: item
            });
        }
        if (detailData.result.ignore) {
            ignores.push({
                root: true,
                command: item.command,
                instruct: item
            });
        }
        // 处理子指令, 新建的话子指令绝对不会重复, 合并才可能重复, 忽略的话子指令也将忽略
        if (detailData.itemChoose !== 'ignore') {
            if (!item.children) continue;
            let childChoose = globalChoose, childAlias = globalAliasChoose;

            // 合并才有必要传入现有数据, 新增无需现有数据直接新增即可
            const childInstruct = {};
            detailData.itemChoose === 'merge' && item.children.forEach(_ => childInstruct[_.command] = _);

            for (let child of item.children) {
                // 更改了父指令的 command 也需要修改子指令的 parent
                if (detailData.suffix) {
                    child.parent = item.command;
                }
                const childDetailData = await detail_merge(child, childChoose, childAlias, childInstruct, false);
                // 形参不能改变原数据, 修改存储的原数据
                childChoose = childDetailData.globalChoose;
                childAlias = childDetailData.globalAliasChoose;
                if (childDetailData.result.error) {
                    errorsChild.push({
                        root: false,
                        parent: item,
                        error: childDetailData.result.error,
                        parentCommand: item.command,
                        command: child.command,
                        id: child.id,
                        instruct: child
                    });
                }
                if (childDetailData.result.ignore) {
                    ignoreChild.push({
                        root: false,
                        parent: item,
                        parentCommand: item.command,
                        command: child.command,
                        instruct: child
                    });
                }
            }
        }
    }
    // todo 忽略数据, 记录并返回, 成功数区分根指令与子指令
    return {
        successRoot: json.length - errors.length,
        failRoot: errors.length,
        ignoreRoot: ignores.length,
        failChild: errorsChild.length,
        ignoreChild: ignoreChild.length,
        failRootData: errors,
        failChildData: errorsChild,
        ignoreRootData: ignores,
        ignoreChildData: ignoreChild
    };
}

module.exports = importInstruct;