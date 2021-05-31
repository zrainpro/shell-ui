// 创建字符串
function createStr(num) {
  let str = '';
  for (let i = num; i > 0; i --) {
    str += ' ';
  }
  return str;
}

module.exports = {
  createStr
}
