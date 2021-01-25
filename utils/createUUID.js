function random(max, min = 0) {
  return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = function createUUID () {
  const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let timestamp = new Date().getTime();
  let uuid = '';
  while (timestamp > 0) {
    uuid += str[timestamp % 52];
    timestamp = Math.floor(timestamp / 52);
  }
  // 在随机添加五位字符串
  for (let i = 0; i < 5; i++) {
    uuid += str[random(52)];
  }
  return uuid;
}
