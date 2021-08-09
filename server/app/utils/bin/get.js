/**
 * 查询某个指令的数据
 * @param _this
 * @param params
 * @returns {Promise<{error: string, command: null}>}
 */
async function getInstructFromName({ _this, params }) {
    const { json, shell } = _this;
    const shellData = json.get('shell');
    let command = null;
    let error = '';
    // 如果是根元素, 直接获取即可
    if (!params.parent || params.parent === 'root') {
        if (shellData[params.command]) {
            command = shellData[params.command];
        } else {
            error = `指令 ${params.command} 不存在!`;
        }
    } else {
        // 不是根元素, 则需要根据父元素获取对应子元素
        if (shellData[params.parent]) {
            error = `指令 ${params.command} 不存在!`;
            shellData[params.parent].children.find(item => {
                if (item.command === params.command) {
                    command = item;
                    error = '';
                    return true;
                }
            });
        } else {
            error = `根指令 ${params.parent} 不存在!`;
        }
    }
    return { error, command }
}

module.exports = getInstructFromName;