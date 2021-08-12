<template>
  <div ref="editor" class="monaco-editor" :style="`height: ${height}px`" />
</template>

<script>
  import Monaco from '../utils/monaco';

  export default {
    name: 'monaco-editor',
    props: {
      lang: {
        type: String,
        default: 'nodejs'
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
        form: '',
        // 语言类型进行转换
        langTransform: {
          zx: 'javascript'
        }
      }
    },
    mounted () {
      // window.monaco = monaco
      // console.log(monaco.editor.DefaultEndOfLine)
      // monaco.editor.EndOfLineSequence
      this.monacoInstance = new Monaco({
        el: this.$refs.editor,
        options: {
          language: this.lang,
          tabSize: 2,
          value: this.value,
          theme: 'vs-dark'
        },
        change: () => {
          // todo 找 monaco 的方法设置换行符为 IF(\n) 目前 window 下编辑换行是 \r\n
          this.form = (this.monacoInstance.getValue() || '').replace(/\r\n/g, '\n');
          // console.log({ v: this.form }, 'this.form')
          this.$emit('update:value', this.form)
        }
      });
    },
    unmounted () {
      this.monacoInstance.dispose();
    },
    watch: {
      lang() {
        const lang = this.langTransform[this.lang] || this.lang;
        this.monacoInstance.setLang(lang);
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
