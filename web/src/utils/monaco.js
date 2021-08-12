/**
 * 对 monaco-editor 的封装, 创建实例等
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export default class Monaco {
  el = null;
  options = {};
  maxCount = 500; // 获取 dom 的最大次数
  count = 0;
  /** 拖拽的属性 */
  dragX = false; // x 轴默认不允许拖拽
  dragY = true; // y 轴默认允许拖拽
  fullScreen = true; // 默认允许全屏
  /** monaco 的属性 */
  monaco; // monaco 实例
  timer = null; // monaco 内容变化的临时定时器, 节流用
  value = ''; // monaco 的内容
  change = null; // monaco 内容变化的回调函数
  lang = 'text'; // monaco 的语言
  constructor(props) {
    this.el = props.el;
    if (!this.el) { return console.error('参数 "el" 为必填参数!'); }
    this.options = props.options || {};
    this.value = this.options.value || '';
    this.lang = props.options.language || this.lang;
    this.change = props.change;
    this.init().catch((error) => {
      console.error(error)
    });
  }

  /**
   * 初始化 monaco-editor 实例
   */
  async init() {
    // 先获取到元素
    if (!(this.el instanceof Element)) {
      this.el = await this.elementGetReady(this.el);
    }

    // 创建 monaco 实例
    this.monaco = monaco.editor.create(this.el, {
      ...this.options,
      language: this.lang,
      tabSize: this.options.tabSize || 2,
      theme: this.options.theme || 'vs-dark',
      readOnly: this.options.readOnly || false,
      useShadowDOM: this.options.useShadowDOM ?? true
    });

    // 内容变化的回调函数
    this.monaco.onDidChangeModelContent(() => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.value = this.monaco.getValue() || '';
        this.change && this.change.call(this, this.value);
      }, 500);
    })
  }

  /**
   * 获取实例
   * @returns {null}
   */
  get instance() {
    return this.monaco;
  }

  /**
   * 获取 monaco 的内容
   */
  getValue() {
    return this.value;
  }

  /**
   * 设置语言
   */
  setLang(lang) {
    this.lang = lang;
    monaco.editor.setModelLanguage(this.monaco.getModel(), lang);
  }

  /**
   * 设置代码内容
   */
  setValue(value) {
    this.value = value;
    this.monaco.setValue(this.value);
  }

  /**
   * 卸载
   */
  dispose() {
    this.monaco.dispose();
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