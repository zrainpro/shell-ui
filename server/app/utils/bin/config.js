const path = require('path');
const { homedir } = require('os');

/**
 * 支持的文件类型以及对应的文件名
 */
const fileType = {
    shell: 'sh',
    javascript: 'js',
    java: 'java',
    python: 'py',
    go: 'go',
    zx: 'js'
}
/**
 * 项目所在的文件目录绝对地址
 */
const rootPath = path.resolve(__dirname, '../../../../')
const homePath = homedir();



module.exports = {
    fileType,
    rootPath,
    homePath,
}