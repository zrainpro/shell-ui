/**
 * 可交互终端
 */

import Monaco from './monaco';

// todo 使用响应式的方式动态改变 dom 绑定的变量值
export default class Terminal {
  count = 0;
  maxCount = 200;
  monaco; // monaco editor 实例
  log = ''; // 日志
  logTemp = ''; // 临时日志, 用于非永久显示的日志
  logDom; // log 日志窗口的 dom
  inputDom;
  logHeight = 300; // log 日志窗口高度
  path = ''; // 路径管理, 主页路径地址由外部传入, 外部不传默认从 / 根路径执行
  username = ''; // 系统用户
  running = false; // 是否有进程在运行中, 有进程在运行中不显示 用户 路径的等信息
  history = []; // 输入历史
  historyIndex = 0; // 输入历史下标
  constructor(props) {
    this.monacoOptions = props.monacoOptions; // monaco 的选项
    this.el = props.el;
    this.path = props.homedir || '/';
    this.username = props.username || 'guest';
    props.log && (this.log += `${props.log}\n`);
    this.root = Terminal.createElement({ attrs: [['class', 'zr-terminal']] });
    this.execFunc = props.exec; // 执行函数回调
    this.icon = props.icon || new Icon();

    // 设置响应式
    this.reactive('path');
    this.reactive('username');

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    // 创建底部的输入框
    const log = this.createLog();
    const input = this.createInput();
    this.root.appendChild(log);
    this.root.appendChild(input);
    this.el.appendChild(this.root);
  }

  /**
   * 创建 log 日志窗口
   */
  createLog() {
    this.logDom = Terminal.createElement({
      attrs: [['class', 'zr-terminal-log'], ['style', `height: ${this.logHeight}px;display: none;`]],
      events: {
        keydown: (event) => {
          // 活跃的元素不是只读的
          // 直接输入类型的按下 input focus, 组合键不 focus, 65 - 90 48-57 96 - 107
          // 组合按键先记录组合键值, 标记不会触发 focus
          if (document.activeElement && document.activeElement.getAttribute('readonly') !== null) {
            const c = event.keyCode;
            if ((c > 47 && c < 58) || (c > 64 && c < 90) || (c > 95 && c < 108)) {
              if (this.logDom.lastPassKeyCode === undefined) {
                this.inputDom.focus();
                this.logDom.lastPassKeyCode = undefined;
              }
            } else {
              this.logDom.lastPassKeyCode = c;
              setTimeout(() => this.logDom.lastPassKeyCode = undefined, 2000);
            }
          }
        }
      },
      child: [
        {
          attrs: [['class', 'zr-terminal-log-header']],
          child: [
            `<div class="zr-inline"><div style="width: 22px;height: 22px">${this.icon.log}</div> <span style="margin-left: 10px">日志</span></div>`,
            {
              attrs: [['class', 'zr-inline']],
              child: [
                {
                  attrs: [['class', 'zr-btn zr-tooltip'], ['title', '清空日志'], ['style', 'height: 22px;width: 22px']],
                  child: `${this.icon.delete}`,
                  events: {
                    click: this.clearLog.bind(this)
                  }
                },
                {
                  attrs: [['class', 'zr-btn zr-tooltip'], ['title', '关闭日志窗口'], ['style', 'height: 22px;width: 22px']],
                  child: `${this.icon.close}`,
                  events: {
                    click: () => {
                      this.showLog(false);
                    }
                  }
                }
              ]
            }
          ],
          events: {
            dblclick: () => {
              this.logHeight = window.innerHeight - 20;
              Terminal.updateElement({ dom: this.logDom, attrs: [['style', `height: ${this.logHeight}px`]] })
            }
          },
          callback: (target) => {
            // 添加 可变窗口处理
            window.requestAnimationFrame(() => {
              Terminal.resizeAble(target, this.logDom, 'y', ({ height }) => {
                if (height < (window.innerHeight - 20)) {
                  this.logHeight = height;
                  return true;
                } else {
                  return false;
                }
              })
            })
          }
        }
      ]
    });

    window.requestAnimationFrame(() => {
      this.monaco = new Monaco({
        el: this.logDom,
        options: {
          language: 'systemverilog',
          ...this.monacoOptions,
          value: this.log,
          readOnly: true,
          domReadOnly: true,
          contextmenu: true, // 禁用右键菜单
          renderFinalNewline: false, // 末尾不渲染新的一行
          scrollBeyondLastLine: false, // 不能滚动到最后一行之外
          automaticLayout: true // 自动布局 , 会耗损性能
        }
      });
    });

    return this.logDom;
  }

  /**
   * 创建 terminal 的输入框
   */
  createInput() {
    return Terminal.createElement({
      attrs: [['class', 'zr-terminal-input']],
      child: [
        {
          bind: '${this.username}@${this.path}%',
          attrs: [['class', 'zr-terminal-path']]
        },
        {
          name: 'input',
          attrs: [['type', 'text']],
          events: {
            enter: async (event) => {
              const command = event.target.value.trim(); // 去除前后空格并拿到指令
              event.target.value = '';
              this.eval(command);
            },
            click: () => {
              // 展示 log 日志
              this.showLog();
            },
            up: (event) => {
              // 历史输入内容
              event.stopPropagation();
              this.historyIndex = ++this.historyIndex < this.history.length ? this.historyIndex : (this.historyIndex - 1)
              if (this.history[this.historyIndex]) {
                event.target.value = this.history[this.historyIndex];
              }
            },
            down: (event) => {
              // 历史输入内容
              event.stopPropagation();
              this.historyIndex = --this.historyIndex > 0 ? this.historyIndex : 0;
              if (this.history[this.historyIndex]) {
                event.target.value = this.history[this.historyIndex];
              }
            },
            tab: (event) => {
              event.preventDefault();
              // tab 补全
              console.log(event.target.value);
              const command = event.target.value;
              // 解释执行 command
              this.detailTab(command);
            }
          },
          callback: (target) => {
            this.inputDom = target;
          }
        },
        {
          attrs: [['class', 'zr-btn zr-tooltip'], ['title', '反馈 bug'], ['style', 'height: 20px;width: 30px;padding: 0 5px']],
          child: this.icon.bug,
          events: {
            click() {
              window.open('https://github.com/zrainice/shell-ui/issues')
            }
          }
        }
      ]
    }, this);
  }

  /**
   * 处理 tab 补全
   * @param command
   */
  detailTab(command) {
    // detailPath
    let commandPath = command.split(/ +/).slice(-1)[0];
    // 拿出未写全的地址
    let p = commandPath.match(/([a-z]|[A-Z]|[_]|[-]|[1-9]|[.])+$/);
    p = p && p.length ? p[0] : '';
    const dir = commandPath.replace(p, '');
    this.exec(p, Terminal.detailPath(this.path, dir), (result) => {
      if (!result.length) {
        this.logTemp = '';
        this.monaco.setValue(`${this.log}\n抱歉没有匹配到结果呢`);
        this.monaco.scrollTo(1000000);
        return
      }
      if (result.length === 1) {
        this.inputDom.value = command.replace(p, '') + result[0];
        this.monaco.setValue(this.log);
      } else {
        // 补全已匹配到的最大值
        this.inputDom.value = command.replace(p, Terminal.getBestMatch(result));
        this.logTemp = Terminal.stdoutTable(result);
        this.monaco.setValue(`${this.log}\n为您匹配到如下结果:\n${this.logTemp}`);
        this.monaco.scrollTo(1000000);
      }
    }, 'tab')
  }

  /**
   * 解释执行命令, 集成内部执行与外部执行
   * @param command
   */
  detailCommand(command) {
    const needContinue = this.detailCommandBefore(command);
    if (needContinue) {
      let once = true;
      this.exec(command, this.path, (result) => {
        if (!result.error && once) {
          once = false;
          this.detailCommandAfter(command);
        }
        // 对于 ls 罗列进行特殊处理, 让其不换行
        if (command.toLowerCase() === 'ls' || command.startsWith('ls ')) {
          // 一行显示五个内容, 一行显示一百个字符, 动态规划一行显示的个数
          result.output = Terminal.stdoutTable((result.output || '').split('\n'));
        }
        this.log += (result.error || result.output);
        this.running = result.running;
        this.monaco.setValue(this.log);
        this.monaco.scrollTo(1000000);
      }, 'normal');
    }
  }

  /**
   * 内部集成一些 command 解释器, 前置, 内部先执行, 然后返回是否需要外部解释器执行
   * @param command
   */
  detailCommandBefore(command) {
    // 处理 clear 逻辑
    if (command === 'clear') {
      this.clearLog()
      return false;
    }
    return true
  }
  /**
   * 内部集成的一些 command 解释器, 后置, 外部解释器解释完了在执行
   * @param command
   */
  detailCommandAfter(command) {
    // 处理 cd 命令, 同步更新自身 path
    if (command.startsWith('cd')) {
      const path = command.replace('cd', '').trim();
      this.path = Terminal.detailPath(this.path, path);
    }
  }

  /**
   * 清除日志内容
   */
  clearLog() {
    this.log = '';
    this.monaco.setValue(this.log);
  }

  /**
   * 展示命令框
   */
  showLog(show = true) {
    Terminal.updateElement({ dom: this.logDom, attrs: [['style', show ? 'display: block' : 'display: none']] });
  }

  /**
   * 执行 command
   * @param args
   * @returns {Promise<*|string>}
   */
  exec(...args) {
    this.execFunc && this.execFunc.call(this, ...args);
    // return Promise.resolve(this.execFunc ? this.execFunc.call(this, ...args) : '');
  }

  /**
   * 执行外部传入的命令
   */
  eval(command) {
    this.logTemp = ''; // 把临时日志清空

    this.log && (this.log += '\n');
    // 空内容直接返回
    if (!command) {
      this.monaco.setValue(this.log);
      this.monaco.scrollTo(1000000);
      return;
    }
    // 保存输入历史
    if (this.history.length > 100) {
      this.history.pop();
    }
    this.history.unshift(command);
    this.historyIndex = 0;
    // 打印命令
    if (!this.running) {
      this.log += `${this.username}@${this.path}% ${new Date().toLocaleString()} %  ${command}\n`; // 将输入指令加到日志里面
      this.monaco.setValue(this.log);
      this.monaco.scrollTo(1000000);
    }

    // 解释执行 command
    this.detailCommand(command);
  }

  /**
   * 路径处理, 类似 node 的 path
   */
  static detailPath(source, dir) {
    // 分别处理成地址栈
    const s = source.split(/\\|\//);
    const d = dir.split(/\\|\//);
    for (let path of d) {
      if (path === '..') {
        s.pop();
      } else if (path === '.') {
        continue
      } else {
        s.push(path);
      }
    }
    const temp = s.join('/');
    return temp ? temp : '/';
  }

  /**
   * 创建 element 元素
   */
  static createElement({ name = 'div', bind = '', attrs = [], child = null, events = {}, callback }, thisArg) {
    const temp = document.createElement(name);

    // 添加属性
    attrs.forEach(item => {
      if (typeof item === 'string') {
        temp.setAttribute(item, 'true');
      } else if (item instanceof Array) {
        temp.setAttribute(item[0], item[1]);
      } else if (item instanceof Object) {
        temp.setAttribute(item.attr, item.value)
      }
    });

    // 添加动态绑定的变量
    if (bind) {
      thisArg._reactive = {
        dom: temp,
        render: new Function(`return \`${bind}\``)
      }; // 将此时的 dom 元素以及更新函数记录用于 reative
      const text = thisArg._reactive.render.call(thisArg);
      thisArg._reactive = null;
      temp.innerText = text;
    }

    // 添加子节点
    if (typeof child === 'string') {
      temp.innerHTML += child;
    } else if (child instanceof Element) {
      temp.appendChild(child);
    } else if (child instanceof Array) {
      child.forEach(item => {
        if (typeof item === 'string') {
          temp.innerHTML += item;
        } else if (item instanceof Element) {
          temp.appendChild(item);
        } else if (item instanceof Object) {
          temp.appendChild(Terminal.createElement(item, thisArg));
        }
      });
    } else if (child instanceof Object) {
      temp.appendChild(Terminal.createElement(child, thisArg));
    }

    // 添加事件
    const eventsArr = Object.entries(events);
    if (eventsArr.length) {
      const keyCode = {
        enter: [108, 13],
        left: [37],
        up: [38],
        right: [39],
        down: [40],
        tab: [9]
      }
      eventsArr.forEach(([eventName, callback]) => {
        if (keyCode[eventName]) {
          temp.addEventListener('keydown', (event) => {
            if (keyCode[eventName].includes(event.keyCode)) {
              callback.call(null, event, temp);
            }
          });
        } else {
          temp.addEventListener(eventName, (event) => {
            callback.call(null, event, temp);
          });
        }
      })
    }

    // 处理回调
    callback && callback(temp);

    return temp;
  }

  /**
   * 更新 element 元素内部的属性
   */
  static updateElement({ dom, attrs = [] }) {
    const getAttrs = (str = '', oldAttr = {}) => {
      return (str || '').split(';').reduce((a, b) => {
        const [keyS = '', valueS = ''] = b.split(':');
        const key = keyS.trim();
        const value = valueS.trim();
        if (key === 'remove') {
          delete oldAttr[value];
        } else if (key) {
          a[key] = value
        }
        return a;
      }, {});
    }
    if (dom instanceof Element) {
      // 更新属性, 定义删除属性的方式: remove : 属性名
      attrs.forEach(item => {
        if (typeof item === 'string') {
          dom.setAttribute(item, 'true');
        } else if (item instanceof Array) {
          const oldAttr = getAttrs(dom.getAttribute(item[0]));
          const newAttr = getAttrs(item[1], oldAttr);

          dom.setAttribute(item[0], Object.entries({ ...oldAttr, ...newAttr }).map(([key, val]) => `${key}:${val}`).join(';'));
        } else if (item instanceof Object) {
          const oldAttr = getAttrs(item.attr);
          const newAttr = getAttrs(item.value, oldAttr);
          dom.setAttribute(item.attr, Object.entries({ ...oldAttr, ...newAttr }).map(([key, val]) => `${key}:${val}`).join(';'));
        }
      });
    } else {
      console.error('dom required Element type, but got ' + dom);
    }
  }

  /**
   * 设置元素宽高可拖拽
   * @param resizeDom
   * @param targetDom
   * @param type
   * @param callback
   */
  static resizeAble(resizeDom, targetDom, type = 'xy', callback) {
    resizeDom.addEventListener('mousedown', (event) => {
      const target = {
        canMove: true,
        currentY: event.pageY,
        currentX: event.pageX,
        currentHeight: targetDom.clientHeight,
        currentWidth: targetDom.clientWidth,
        moveable: true
      }
      Terminal.updateElement({ dom: document.body, attrs: [['style', 'user-select: none']] });
      // 同时在 window 上添加一个 mouseup 事件
      const mouseup = () => {
        target.canMove = false;
        window.removeEventListener('mouseup', mouseup);
        window.removeEventListener('mousemove', mousemove);
        Terminal.updateElement({ dom: document.body, attrs: [['style', 'remove: user-select']] });
      }
      const mousemove = (event) => {
        if (!target.moveable) return
        target.moveable = false;
        window.requestAnimationFrame(() => {
          target.moveable = true;
          const xCan = type.includes('x');
          const yCan = type.includes('y');
          let width = target.currentWidth + target.currentX - event.pageX;
          let height = target.currentHeight + target.currentY - event.pageY;
          // 判断是否超出屏幕
          width = width > window.innerWidth ? window.innerWidth : width;
          height = height > window.innerHeight ? window.innerHeight : height;
          const canResize = callback ? callback.call(null, { width, height }) : true;
          if (canResize) {
            let str = '';
            if (xCan) {
              str += `width: ${width}px`;
            }
            if (yCan) {
              str += `${str ? ';' : ''}height: ${height}px`;
            }
            Terminal.updateElement({ dom: targetDom, attrs: [['style', str]] });
          }
        });
      }
      window.addEventListener('mouseup', mouseup);
      window.addEventListener('mousemove', mousemove);
    })
  }

  /**
   * 限定宽度输出为表格的形式
   * @param output
   * @returns {string}
   */
  static stdoutTable(output) {
    // 一行显示五个内容, 一行显示一百个字符, 动态规划一行显示的个数
    let max = output.reduce((a, b) => b.length > a ? b.length : a, 0);
    const maxLength = Math.floor(100 / (max + 5));
    return output.reduce((a, b) => {
      if (!a[0] || a[a.length - 1].length === maxLength) {
        a.push([]);
      }
      a[a.length - 1].push(b);
      return a;
    }, []).map((item) => item.map(it => {
      return it + new Array(max + 5 - it.length).fill(' ').join('')
    }).join('')).join('\n');
  }

  /**
   * 获取到匹配的最大相同内容
   * @param arr
   */
  static getBestMatch(arr) {
    // 先找到最小长度的作为基准, 依次删除最后一个字符, 判断其他是不是都 includes 这个基准字符, 直到找到全部包含的
    let base = arr.reduce((a, b) => a.length < b.length ? a : b, arr[0])
    let allIncludes = false;
    while (!allIncludes) {
      let find = true;
      for (const item of arr) {
        if (!item.includes(base)) {
          find = false;
          break;
        }
      }
      if (!find) {
        base = base.substring(0, base.length - 1);
      }
      allIncludes = find;
    }
    return base;
  }

  /**
   * 设置响应式监听, 并在
   * @param attr
   * @returns {void|*}
   */
  reactive(attr) {
    if (!attr) return console.error('attr is required, but got ' + attr);
    new Watcher({
      attr,
      reactiveKey: '_reactive',
      target: this
    });
  }

  /**
   * 确保元素已经加载完成, 返回元素本身
   * @param el
   * @returns {Promise<unknown>}
   */
  elementGetReady(el) {
    this.count++;
    return new Promise((resolve, reject) => {
      const element = document.querySelector(el);
      if (element) {
        resolve(element)
      } else {
        if (this.count > this.maxCount) {
          reject(`找不到元素 ${el} ! 请确认元素是否存在!`);
        } else {
          window.requestAnimationFrame(() => {
            resolve(this.elementGetReady(el));
          });
        }
      }
    });
  }
}

class Watcher {
  constructor(props) {
    this.attr = props.attr;
    this.dom = new Set();
    this.reactiveKey = props.reactiveKey;
    this.target = props.target;
    this.value = this.target[props.attr];
    Object.defineProperty(this.target, this.attr, {
      get: () => {
        this.target[this.reactiveKey] && this.dom.add(this.target[this.reactiveKey])
        return this.value;
      },
      set: (value) => {
        this.value = value;
        this.dom.forEach((item) => {
          item.dom.innerText = item.render.call(this.target);
        });
      }
    })
  }
}

class Icon {
  constructor() {
    this.log = '<svg t="1628764820322" class="zr-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3154" width="64" height="64"><path d="M555.03 906H252c-5.42 0-10.82-0.54-16.12-1.62a79.762 79.762 0 0 1-28.61-12.04 80.282 80.282 0 0 1-28.99-35.2 78.938 78.938 0 0 1-4.66-15.02A80.141 80.141 0 0 1 172 826V198c0-5.42 0.54-10.82 1.62-16.12a79.762 79.762 0 0 1 12.04-28.61 80.193 80.193 0 0 1 35.2-28.98c4.84-2.05 9.87-3.61 15.02-4.66a80.141 80.141 0 0 1 16.12-1.62h500c5.42 0 10.82 0.54 16.12 1.62a79.762 79.762 0 0 1 28.61 12.04 80.193 80.193 0 0 1 28.98 35.2c2.05 4.84 3.61 9.87 4.66 15.02 1.08 5.3 1.63 10.71 1.63 16.12v393.06c-91.06-71.83-223.11-56.24-294.94 34.82-66.45 84.24-58.71 205.04 17.97 280.11zM306 412c-11.04-0.01-19.99 8.93-20 19.97V482c-0.01 11.04 8.93 19.99 19.97 20H524c11.04 0.01 19.99-8.93 20-19.97V432c0.01-11.04-8.93-19.99-19.97-20H306z m0-170c-11.04-0.01-19.99 8.93-20 19.97V312c-0.01 11.04 8.93 19.99 19.97 20H698c11.04 0.01 19.99-8.93 20-19.97V262c0.01-11.04-8.93-19.99-19.97-20H306z" p-id="3155"></path><path d="M702 906c-10.15 0-20.28-1.02-30.23-3.05a149.25 149.25 0 0 1-53.64-22.57 150.497 150.497 0 0 1-54.35-66c-3.84-9.07-6.76-18.5-8.74-28.16a151.58 151.58 0 0 1 0-60.46 149.25 149.25 0 0 1 22.57-53.64 150.497 150.497 0 0 1 66-54.35c9.07-3.84 18.51-6.76 28.16-8.74a151.58 151.58 0 0 1 60.46 0 149.25 149.25 0 0 1 53.64 22.57 150.497 150.497 0 0 1 54.35 66c3.84 9.07 6.76 18.51 8.74 28.16a151.58 151.58 0 0 1 0 60.46 149.25 149.25 0 0 1-22.57 53.64 150.497 150.497 0 0 1-66 54.35c-9.07 3.84-18.51 6.76-28.16 8.74-9.95 2.03-20.08 3.05-30.23 3.05z m-4-129.32c1.32 0.21 2.66 0.32 4 0.32h60c13.81 0 25-11.19 25-25s-11.19-25-25-25h-43v-43c0-13.81-11.19-25-25-25s-25 11.19-25 25v68c-0.01 13.8 11.16 24.99 24.96 25h0.04c1.34 0 2.68-0.11 4-0.32z" p-id="3156"></path></svg>'
    this.delete = '<svg t="1628765098625" class="zr-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12037" width="64" height="64"><path d="M866.133333 216.234667h-136.448V167.424a38.4 38.4 0 0 0-39.253333-39.424H331.690667a38.4 38.4 0 0 0-39.253334 39.424v46.933333H156.032c-14.933333 1.877333-28.032 15.061333-28.032 30.08s13.098667 28.16 28.032 28.16h711.936c14.933333 0 28.032-13.141333 28.032-28.16-1.877333-15.018667-14.933333-28.16-29.866667-28.16z m-108.373333 116.48H264.362667c-7.466667 0-14.933333 1.834667-18.688 7.466666a24.149333 24.149333 0 0 0-7.466667 18.773334v454.4C238.250667 858.453333 275.626667 896 320.426667 896h383.061333c44.842667 0 82.218667-37.546667 82.218667-82.602667V358.997333c0-15.061333-13.098667-26.325333-28.032-26.325333zM440.021333 770.133333c0 15.018667-13.098667 28.16-28.032 28.16a28.8 28.8 0 0 1-28.032-28.16v-296.661333c0-15.018667 13.098667-28.16 28.032-28.16 14.933333 0 28.032 13.141333 28.032 28.16v296.661333z m198.058667 0c0 15.018667-13.056 28.16-28.032 28.16a28.8 28.8 0 0 1-28.032-28.16v-296.661333c0-15.018667 13.098667-28.16 28.032-28.16 14.933333 0 28.032 13.141333 28.032 28.16v296.661333z" p-id="12038"></path></svg>'
    this.close = '<svg t="1628766238408" class="zr-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="14558" width="64" height="64"><path d="M519.02036023 459.47959989L221.8941505 162.35411435a37.07885742 37.07885742 0 1 0-52.45354772 52.40502656l297.12476134 297.15010821L169.44060278 809.05863314a37.07885742 37.07885742 0 1 0 52.42964924 52.42892505l297.15010821-297.12476136 297.15010822 297.12476136a37.07885742 37.07885742 0 1 0 52.42892504-52.40430237l-297.12476135-297.1740067 297.12476135-297.12548553a37.07885742 37.07885742 0 1 0-52.42892504-52.42964924L519.04498291 459.47959989z" p-id="14559"></path></svg>'
    this.bug = '<svg t="1628765261118" class="zr-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13767" width="64" height="64"><path d="M1021.632671 584.711228c0 11.280461-4.042431 21.051002-12.127294 29.311622-8.076874 8.252632-17.64769 12.382942-28.69647 12.382942h-142.899152c0 74.265697-14.244378 137.234955-42.741123 188.899785l132.689217 136.16443c8.076874 8.260621 12.119305 18.031162 12.119305 29.319611 0 11.280461-4.042431 21.051002-12.119305 29.303633-7.653457 8.252632-17.216284 12.382942-28.704459 12.382943-11.488175 0-21.051002-4.13031-28.704459-12.382943l-126.313998-128.327225a123.749531 123.749531 0 0 1-9.554838 8.468335c-4.250145 3.467224-13.181842 9.650706-26.7871 18.550446a400.280602 400.280602 0 0 1-41.478862 23.759271c-14.044653 6.950426-31.47664 13.245754-52.295961 18.885984-20.82731 5.64023-41.454895 8.468335-61.898733 8.468334V376.206449H470.471911v583.691947c-21.69811 0-43.276386-2.931961-64.758793-8.803872-21.474418-5.863922-39.968942-13.030051-55.483569-21.506374a533.417202 533.417202 0 0 1-42.086026-25.397015c-12.550711-8.444368-21.809956-15.49865-27.769746-21.170837L270.826928 873.888877l-116.727205 134.830267c-8.516269 9.107454-18.726204 13.66917-30.621817 13.669171-10.201947 0-19.349346-3.467224-27.434209-10.41765-8.084863-7.813237-12.438865-17.471932-13.062007-28.976084-0.631131-11.504153 2.660335-21.610231 9.874398-30.310247l128.854499-147.876296c-24.662027-49.507802-36.989047-109.001847-36.989046-178.490125H41.822388c-11.04878 0-20.611607-4.13031-28.696469-12.382942S0.998624 595.911798 0.998624 584.623349c0-11.280461 4.042431-21.051002 12.127295-29.303634 8.084863-8.260621 17.655679-12.382942 28.696469-12.382942h142.899153V351.40062L74.361565 238.707857c-8.084863-8.252632-12.119305-18.023173-12.119306-29.311622 0-11.280461 4.034442-21.051002 12.119306-29.303634 8.084863-8.260621 17.655679-12.382942 28.704459-12.382942s20.611607 4.122321 28.704458 12.382942l110.351987 112.692763h538.426302l110.359976-112.692763c8.084863-8.260621 17.655679-12.382942 28.69647-12.382942 11.056769 0 20.619596 4.122321 28.704459 12.382942 8.084863 8.252632 12.127294 18.023173 12.127294 29.303634 0 11.28845-4.042431 21.058991-12.127294 29.319611l-110.359976 112.684774v191.536153h142.899152c11.04878 0 20.611607 4.122321 28.704459 12.382942 8.076874 8.252632 12.119305 18.023173 12.119305 29.303634l-0.039945 0.07989zM715.430474 209.484114H307.160877c0-57.760433 19.884608-106.940686 59.645836-147.548748C406.57593 21.327305 454.733591 1.027269 511.295675 1.027269c56.562084 0 104.719746 20.300036 144.488963 60.908097 39.761228 40.608061 59.645836 89.796303 59.645836 147.548748z" p-id="13768"></path></svg>'
  }
}