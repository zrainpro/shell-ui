<template>
  <div class="manage">
    <div class="search">
      <div>
        <a-input-search
            v-model:value="search.keywords"
            size="large"
            placeholder="搜索指令"
            style="width: 300px;margin-right: 20px"
            enter-button
            @search="onSearch"
        />
        <My-Label name="脚本类型">
          <a-select
              v-model:value="search.type"
              style="width: 200px"
              size="large"
              @change="onSearch"
          >
            <a-select-option value="all">全部</a-select-option>
            <a-select-option v-for="item in state.supportScript" :key="item.value" :value="item.value">{{item.label}}</a-select-option>
          </a-select>
        </My-Label>
        <My-Label name="状态">
          <a-select
              v-model:value="search.enable"
              style="width: 200px"
              size="large"
              @change="onSearch"
          >
            <a-select-option value="all">全部</a-select-option>
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="2">禁用</a-select-option>
          </a-select>
        </My-Label>
      </div>
      <div class="button-group" style="justify-content: flex-end">
        <a-button type="primary" ghost @click="addShell">新增</a-button>
        <a-button type="primary" ghost @click="exportFile">导出</a-button>
        <a-button type="primary" ghost @click="importFile">导入</a-button>
        <!--    暂时屏蔽批量删除    -->
        <!-- <a-button type="danger" ghost>删除</a-button> -->
      </div>
    </div>
    <div class="table">
      <a-table :columns="table.columns"
               :data-source="table.data"
               row-key="id"
               :indentSize="5"
               :row-selection="rowSelection">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enable'">
            <!-- 自身脚本禁止禁用 -->
            <a-switch checked-children="启用"
                      un-checked-children="禁用"
                      v-if="record.command !== 'shell' && record.parent !== 'shell'"
                      v-model:checked="record.enable"
                      @change="changeChecked(record, $event)"
            />
          </template>
          <template v-else-if="column.key === 'operation'">
            <!-- 自身脚本禁止修改删除 -->
            <a-button type="link" @click="execShell(record)">执行</a-button>
            <a-button v-if="record.command !== 'shell' && record.parent !== 'shell'" type="link" @click="editShell(record)">编辑</a-button>
            <a-button type="link" @click="showDeleteShell(record)">删除</a-button>
          </template>
        </template>
      </a-table>
    </div>
    <a-modal v-model:open="modalData.show" :title="modalData.title" @ok="deleteShell">
      <p>{{ modalData.content }}</p>
    </a-modal>
  </div>
</template>

<script>
  import { reactive } from 'vue';
  import supportType from '../../../utils/supportType';
  import Label from '../../components/Label';

  export default {
    name: 'mannage-Home',
    components: {
      MyLabel: Label
    },
    setup() {
      // 表格展示的信息
      const table = reactive({
        columns: [
          { title: 'command', dataIndex: 'command', key: 'command', width: 140, fixed: 'left', align: 'left', ellipsis: true },
          { title: '简写', dataIndex: 'alias', key: 'alias', width: 80 },
          { title: '脚本类型', dataIndex: 'type', key: 'type', width: 80 },
          { title: '是否启用', dataIndex: 'enable', key: 'enable', width: 100 },
          { title: '简介', dataIndex: 'description', key: 'description', width: 120, ellipsis: true },
          { title: '脚本', dataIndex: 'shell', key: 'shell', width: 240, ellipsis: true },
          { title: '操作', dataIndex: 'operation', key: 'operation', width: 130, fixed: 'right' }
        ],
        data: []
      })
      let state = reactive({
        selected: [],
        supportScript: supportType || [
          { value: 'shell', label: 'shell' },
          { value: 'javascript', label: 'js脚本' },
          { value: 'python', label: 'Python' },
          { value: 'java', label: 'java' },
          { value: 'go', label: 'go' }
        ]
      });
      const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
          console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
          state.selected = selectedRows;
        },
        // onSelect: (record, selected, selectedRows) => {
        //   console.log(record, selected, selectedRows);
        // },
        // onSelectAll: (selected, selectedRows, changeRows) => {
        //   console.log(selected, selectedRows, changeRows);
        // }
      };
      // 搜索相关
      const search = reactive({
        keywords: '',
        type: 'all',
        enable: 'all'
      })

      // 弹窗相关
      const modalData = reactive({
        show: false,
        title: '',
        content: '',
        item: null
      });

      return {
        table,
        rowSelection,
        state,
        search,
        modalData
      }
    },
    mounted() {
      this.onSearch();
    },
    methods: {
      onSearch() {
        this.apiGet('/api/search', {
          params: {
            keywords: this.search.keywords,
            type: this.search.type === 'all' ? '' : this.search.type,
            enable: this.search.enable === 'all' ? '' : this.search.enable
          }
        }).then(res => {
          if (res.code === 200) {
            this.table.data = res.data.map(item => {
              if (!item.children || !item.children.length) {
                delete item.children
              }
              return item;
            });
          }
        })
      },
      // 执行脚本
      execShell(command) {
        this.$root.terminal && this.$root.terminal.eval(`${command.parent || ''} ${command.command}`);
      },
      // 添加 shell 脚本
      addShell() {
        this.$router.push('/manage/create')
      },
      // 编辑脚本
      editShell(item) {
        this.$router.push(`/manage/edit/${item.id}`)
      },
      // 删除脚本
      showDeleteShell(item) {
        this.modalData.show = true;
        this.modalData.title = item.parent ? '该操作不可恢复,您确定要删除脚本嘛?' : '您删除的是根脚本,会连同子脚本一同删除!!';
        this.modalData.content = item.parent ? '如果只是暂时不用可以禁用脚本哦' : '子脚本也会被一同删除且不可恢复哦, 请谨慎操作!!!';
        this.modalData.item = item;
      },
      // 删除脚本
      deleteShell() {
        this.apiPost(`/api/delete/${this.modalData.item.id}`).then(res => {
          if (res.code === 200) {
            this.$message.success('删除成功!');
            this.onSearch(); // 重新请求数据
            this.modalData.show = false;
          }
        })
      },
      // 修改启用状态
      changeChecked(item, checked) {
        this.apiPost('/api/enable', { id: item.id, enable: checked }).then(res => {
          if (res.code === 200) {
            this.$message.success(res.message);
          }
        })
      },
      // 导出指令文件
      exportFile() {
        this.apiGet('/api/export', { params: { ids: this.state.selected.map(item => item.id).join(',') } }).then(res => {
          if (res.code === 200) {
            const a = document.createElement('a');
            a.download = 'download.json';
            a.href = window.URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type:"text/plain;charset=utf-8" }));
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        })
      },
      // 导入指令文件
      importFile() {
        // 先创建 file 的 input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style = 'position: absolute;top: 0;left: 0;z-index: -999;opacity: 0;';
        input.multiple = false;
        input.onchange = (e) => {
          console.log(e);
          const file = e.target.files[0];
          const formData = new FormData();
          console.log(file);
          formData.append('file', file)
          this.apiPost('/api/import', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }).then(res => {
            console.log(res);
            this.onSearch();
            // todo 把错误信息给出来
            this.$message.success('导入成功');
          })
          console.log(file);
        }
        document.body.appendChild(input);
        input.click();
      }
    }
  }
</script>

<style lang="less" scoped>
  .manage {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    background-color: #e4f5ef;
    width: 100%;
    min-height: 100%;
    border-radius: 5px;
    padding: 16px;
    >* {
      width: 100%;
    }
    .search {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      margin-bottom: 10px;
      > * {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: flex-start;
        width: 100%;
      }
      > * + * {
        margin-top: 10px;
      }
      .button-group {
        justify-content: flex-end;
        > * + * {
          margin-left: 10px;
        }
      }
    }
    .table {
      width: 100%;
      min-width: 600px;
      overflow-x: auto;
      ::v-deep(.ant-table-body) {
        overflow: auto;
      }
      ::v-deep(.ant-btn-link) {
        padding: 0 5px;
      }
    }
  }
</style>
