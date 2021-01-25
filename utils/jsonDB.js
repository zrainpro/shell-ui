const fs = require('fs');
const lodash = require('lodash');

const state = {}

class JSONDB {
  constructor(props = { path }) {
    this.props = props;
    this.path = props.path; // json 文件的目录
    this.jsonPath = props.path; // json 文件绝对路径
    this.init(); // 初始化, 读取 json 文件
  }

  init() {
    // 在判断 json 文件是否存在
    if (!fs.existsSync(this.jsonPath)) {
      fs.writeFileSync(this.jsonPath, '{}')
    }
    if (!state[this.jsonPath]) {
      state[this.jsonPath] = require(this.jsonPath);
    }
  }

  /**
   * 获取数据, 语法同 lodash
   */
  get(path, defaultValue) {
    return lodash.get(state[this.jsonPath], path, defaultValue);
  }

  /**
   * 设置数据, 语法同 lodash
   */
  set(path, value) {
    return lodash.set(state[this.jsonPath], path, value);
  }

  /**
   * 删除数据, 语法同 lodash, 只支持对象的删除, 不支持数组的删除
   * 支持链式操作
   */
  delete(path) {
    // 先获取调用栈, 拿到要删除的数据的上一级
    let temp = state[this.jsonPath];
    const tempArr = path.split('.');
    const lastKey = tempArr.pop(); // 把最后一个 pop 出来, 为了取上一级
    tempArr.forEach((key, index) => {
      temp = temp[key]
    });
    // 使用 delete 运算符删除对应的数据
    delete temp[lastKey];
    return this
  }

  /**
   * 写入数据到 json 文件
   */
  write() {
    fs.writeFileSync(this.jsonPath, JSON.stringify(state[this.jsonPath], null, 2))
  }

  /**
   * 删除实例, 同时回收 state 中的数据, 降低内存占有
   */
  destroy() {
    delete state[this.jsonPath];
  }
}

module.exports = JSONDB
