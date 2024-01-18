const fs = require('fs');
const path = require('path');

function mkdirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    const parentPath = path.resolve(dirPath, '../');
    if (!fs.existsSync(parentPath)) {
      mkdirSync(parentPath);
    }
    fs.mkdirSync(dirPath);
  }
}

function writeFileSync(filePath, data, options) {
  // 先创建父级目录
  const parentPath = path.resolve(filePath, '../');
  mkdirSync(parentPath);
  // 在写入文件
  fs.writeFileSync(filePath, data, options);
}

module.exports = {
  ...fs,
  mkdirSync,
  writeFileSync,
};
