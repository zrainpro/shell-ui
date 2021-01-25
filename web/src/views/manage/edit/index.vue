<template>
  <div class="editor">
    <div>
      <a-button @click="cancel" type="danger" style="margin-right: 15px" ghost>取消</a-button>
      <a-button @click="save" type="primary" ghost>保存</a-button>
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
          <a-select-option value="shell">shell</a-select-option>
          <a-select-option value="javascript">javascript</a-select-option>
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

  export default {
    name: "index",
    components: {
      Monaco,
      Label
    },
    setup() {
      const state = reactive({
        shells: [],
        form: {
          command: '',
          alias: '',
          description: '',
          type: 'shell',
          parent: 'root',
          oldParent: '',
          shell: '',
          id: ''
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
      },
      cancel() {
        this.$router.go(-1);
      },
      save() {
        this.apiPost(this.$route.params.id ? '/api/edit' : '/api/create', this.state.form).then(res => {
          if (res.code === 200) {
            this.$message.success(this.$route.params.id ? '修改指令成功' : '创建指令成功');
            this.$router.push('/manage');
          }
        })
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
