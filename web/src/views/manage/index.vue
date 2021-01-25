<template>
  <div class="manage">
    <div class="search">
      <div>
        <a-input-search
            v-model:value="search.keywords"
            size="large"
            placeholder="搜索指令"
            style="width: 300px"
            @search="onSearch"
        />
        <Label name="脚本类型">
          <a-select
              v-model:value="search.type"
              style="width: 200px"
              size="large"
              @change="onSearch"
          >
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="shell">shell</a-select-option>
            <a-select-option value="javascript">js脚本</a-select-option>
          </a-select>
        </Label>
        <Label name="状态">
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
        </Label>
      </div>
      <div class="button-group" style="justify-content: flex-end">
        <a-button type="primary" ghost @click="addShell">新增</a-button>
        <a-button type="primary" ghost @click="exportFile">导出</a-button>
        <!--    暂时屏蔽批量删除    -->
        <!-- <a-button type="danger" ghost>删除</a-button> -->
      </div>
    </div>
    <div class="table">
      <a-table :columns="table.columns"
               :data-source="table.data"
               row-key="id"
               :row-selection="rowSelection">
        <template #enable="{ record }">
          <!-- 自身脚本禁止禁用 -->
          <a-switch checked-children="启用"
                    un-checked-children="禁用"
                    v-if="record.command !== 'shell' && record.parent !== 'shell'"
                    v-model:checked="record.enable"
                    @change="changeChecked(record, $event)"
          />
        </template>
        <template #operation="{ record }">
          <!-- 自身脚本禁止修改删除 -->
          <a-button v-if="record.command !== 'shell' && record.parent !== 'shell'" type="link" @click="editShell(record)">编辑</a-button>
          <a-popconfirm
              v-if="record.command !== 'shell' && record.parent !== 'shell'"
              title="您确定要删除嘛?该操作不可恢复!!!"
              @confirm="deleteShell(record)"
          >
            <a-button type="link">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script>
  import { reactive } from 'vue';
  import Label from '../../components/Label';

  export default {
    name: 'Home',
    components: {
      Label
    },
    setup() {
      // 表格展示的信息
      const table = reactive({
        columns: [
          { title: 'command', dataIndex: 'command', key: 'command', width: 100 },
          { title: '简写', dataIndex: 'alias', key: 'alias', width: 70 },
          { title: '脚本类型', dataIndex: 'type', key: 'type', width: 80 },
          { title: '是否启用', dataIndex: 'enable', key: 'enable', width: 100, slots: { customRender: 'enable' } },
          { title: '简介', dataIndex: 'description', key: 'description', width: 120, ellipsis: true },
          { title: '脚本', dataIndex: 'shell', key: 'shell', width: 240, ellipsis: true },
          { title: '操作', dataIndex: 'id', key: 'id', width: 160, slots: { customRender: 'operation' } }
        ],
        data: []
      })
      let state = reactive({
        selected: []
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

      return {
        table,
        rowSelection,
        state,
        search
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
      // 添加 shell 脚本
      addShell() {
        this.$router.push('/manage/create')
      },
      // 编辑脚本
      editShell(item) {
        this.$router.push(`/manage/edit/${item.id}`)
      },
      // 删除脚本
      deleteShell(item) {
        this.$confirm({
          title: item.parent ? '该操作不可恢复,您确定要删除脚本嘛?' : '您删除的是根脚本,会连同子脚本一同删除!!',
          content: item.parent ? '如果只是暂时不用可以禁用脚本哦' : '子脚本也会被一同删除且不可恢复哦, 请谨慎操作!!!',
          onOk: () => {
            return new Promise(resolve => {
              this.apiPost(`/api/delete/${item.id}`).then(res => {
                if (res.code === 200) {
                  this.$message.success('删除成功!');
                  this.onSearch(); // 重新请求数据
                  resolve();
                }
              })
            })
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
  }
</style>
