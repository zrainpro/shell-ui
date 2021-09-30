<template>
  <div class="editor">
    <div class="controller">
      <a-button @click="cancel" type="danger" ghost>取消</a-button>
      <a-button @click="save" type="primary" ghost>保存</a-button>
      <a-button @click="runCode" ghost>调试</a-button>
    </div>
    <div class="editor-info">
      <Label name="父级脚本">
        <a-select
            v-model:value="state.form.parent"
            style="width: 300px"
            size="large"
            placeholder="父级脚本"
            @change="handleChange"
        >
          <a-select-option value="root">根级脚本</a-select-option>
          <a-select-option v-for="item in state.shells" :key="item" :value="item">{{item}} 子脚本</a-select-option>
        </a-select>
      </Label>
      <Label name="指令名">
        <a-input
            v-model:value="state.form.command"
            size="large"
            placeholder="指令名"
            style="width: 300px"
        />
      </Label>
      <Label name="指令简写">
        <a-input
            v-model:value="state.form.alias"
            size="large"
            placeholder="指令简写"
            style="width: 300px"
        />
      </Label>
      <Label name="指令简介">
        <a-input
            v-model:value="state.form.description"
            size="large"
            placeholder="指令简介"
            style="width: 300px"
        />
      </Label>
      <Label name="指令类型">
        <a-select
            v-model:value="state.form.type"
            placeholder="指令类型"
            style="width: 300px"
            size="large"
            @change="handleChange"
        >
          <a-select-option v-for="item in state.shellType" :key="item" :value="item">{{item}}</a-select-option>
        </a-select>
      </Label>
    </div>
    <monaco :lang="state.form.type" v-model:value="state.form.shell" :height="440"></monaco>
  </div>
</template>

<script>
  import { reactive } from 'vue';
  import Monaco from '../../../components/Monaco';
  import Label from '../../../components/Label';
  import supportType from '../../../../utils/supportType';

  export default {
    name: "index",
    components: {
      Monaco,
      Label
    },
    setup() {
      const state = reactive({
        shells: [],
        shellType: supportType.map(_ => _.value),
        tempCommand: '', // 临时调试的指令名
        tempCommandId: '', // 临时调试的指令ID
        form: {
          command: '',
          alias: '',
          description: '',
          type: 'shell',
          parent: 'root',
          oldParent: '',
          shell: '',
          id: ''
        },
        initCode: {
          java: `/*
* java 代码不支持 publish, 只允许写 class
* 支持写多个 class, 调用指定 class 只需要在命令行中输入:
    [command] class名
* 不写 class 名默认执行第一个 class
*/
class YourClass {
    /* 第一个Java程序
     * 它将输出字符串 Hello World
     */
    public static void main(String[] args) {
        System.out.println("Hello World"); // 输出 Hello World
    }
}
          `,
          javascript: `/*
* javascript 代码暂不支持自定义依赖包
*/
          `
        }
      });

      return {
        state
      }
    },
    mounted() {
      // 获取 shell 脚本列表列表
      this.apiGet('/api/root').then(res => {
        if (res.code === 200) {
          this.state.shells = res.data;
        }
      });
      // 获取 shell 脚本本身
      if (this.$route.params.id) {
        this.apiGet(`/api/shell/${this.$route.params.id}`).then(res => {
          if (res.code === 200 && res.data) {
            const data = res.data;
            this.state.form = reactive({
              command: data.command,
              alias: data.alias,
              description: data.description,
              type: data.type || 'shell',
              parent: data.parent || 'root',
              oldParent: !data.parent || data.parent === 'root' ? '' : data.parent,
              shell: data.shell || '',
              id: data.id
            })
          }
        })
      }
    },
    methods: {
      handleChange() {
        const type = this.state.form.type;
        const initCode = this.state.initCode;
        if (this.state.form.shell && initCode[type] && this.state.form.shell !== initCode[type]) return
        // 切换代码给出提示以及初始代码
        this.state.form.shell = initCode[type];
      },
      runCode() {
        if (!this.state.tempCommand) {
          this.state.tempCommand = `test_${new Date().getTime()}`;
        }
        (new Promise(resolve => {
          this.apiPost(this.state.tempCommandId ? '/api/edit' : '/api/create', {
            parent: 'root',
            command: this.state.tempCommand,
            type: this.state.form.type,
            shell: this.state.form.shell,
            id: this.state.tempCommandId
          }).then(res => {
            if (res.code === 200) {
              !this.state.tempCommandId && (this.state.tempCommandId = res.data);
              resolve();
            }
          });
        })).then(() => {
          this.$root.terminal && this.$root.terminal.eval(this.state.tempCommand);
        })
      },
      cancel() {
        this.$message.info('正在为您清除临时指令信息, 请稍等~');
        this.remove();
        this.$router.go(-1);
      },
      save() {
        if (!this.state.form.command) {
          this.$message.error('请输入指令名!');
          return
        }
        this.remove();
        this.apiPost(this.$route.params.id ? '/api/edit' : '/api/create', this.state.form).then(res => {
          if (res.code === 200) {
            this.$message.success(this.$route.params.id ? '修改指令成功' : '创建指令成功');
            this.$router.push('/manage');
          }
        });
      },
      remove(id = this.state.tempCommandId) {
        if (id) {
          this.apiPost(`/api/delete/${id}`).then(res => {
            if (res.code === 200) {
              this.$message.success('成功为您删除临时指令');
            }
          })
        }
      }
    }
  }
</script>

<style lang="less" scoped>
.editor {
  width: 100%;
  min-height: 100%;
  background-color: #e4f5ef;
  padding: 20px;
  display: flex;
  flex-direction: column;
  >* + * {
    margin-top: 15px;
  }
  .controller {
    >* + * {
      margin-left: 15px;
    }
  }
  .editor-info {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    flex-wrap: wrap;
    > * {
      margin: 5px;
    }
  }
}
</style>
