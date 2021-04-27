<template>
  <div ref="editor" class="monaco-editor" :style="`height: ${height}px`" />
</template>

<script>
  import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

  export default {
    name: 'monaco-editor',
    props: {
      lang: {
        type: String,
        default: 'javascript'
      },
      height: {
        type: Number,
        default: 300
      },
      value: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        form: ''
      }
    },
    mounted () {
      // window.monaco = monaco
      // console.log(monaco.editor.DefaultEndOfLine)
      // monaco.editor.EndOfLineSequence
      this.monacoInstance = monaco.editor.create(this.$refs.editor, {
        language: this.lang,
        tabSize: 2,
        value: this.value,
        theme: 'vs-dark'
      })
      // window.instance = this.monacoInstance;
      this.monacoInstance.onDidChangeModelContent(() => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          // todo 找 monaco 的方法设置换行符为 IF(\n) 目前 window 下编辑换行是 \r\n
          this.form = (this.monacoInstance.getValue() || '').replace(/\r\n/g, '\n');
          // console.log({ v: this.form }, 'this.form')
          this.$emit('update:value', this.form)
        }, 500);
      })
    },
    unmounted () {
      this.monacoInstance.dispose();
    },
    watch: {
      lang() {
        monaco.editor.setModelLanguage(this.monacoInstance.getModel(), this.lang);
      },
      value() {
        if (this.value !== this.form) {
          this.form = this.value;
          this.monacoInstance.setValue(this.form);
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  .monaco-editor {
    text-align: left;
    height: 300px;
  }
</style>
