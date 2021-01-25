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
      </div>
      <div class="button-group" style="justify-content: flex-end">
        <a-button type="primary" ghost @click="addShell">新增</a-button>
        <a-button type="primary" ghost>导出</a-button>
        <a-button type="danger" ghost>删除</a-button>
      </div>
    </div>
    <div class="table">
      <a-table :columns="table.columns" :data-source="table.data" :row-selection="rowSelection">
        <template #operation="{ record }">
          <a-button type="link">编辑</a-button>
          <a-button type="link">导出</a-button>
          <a-popconfirm
              title="Sure to delete?"
              @confirm="onDelete(record.key)"
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
  import { useRoute } from 'vue-router';

export default {
  name: 'Home',
  components: {
  },
  setup() {
    // 表格展示的信息
    const table = reactive({
      columns: [
        { title: 'command', dataIndex: 'command', key: 'command' },
        { title: '简写', dataIndex: 'alias', key: 'alias' },
        { title: '脚本类型', dataIndex: 'type', key: 'type' },
        { title: '简介', dataIndex: 'description', key: 'description' },
        { title: '脚本', dataIndex: 'shell', key: 'shell' },
        { title: '操作', dataIndex: 'operation', slots: { customRender: 'operation' } }
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
      type: 'all'
    });
    const route = useRoute()

    return {
      table,
      rowSelection,
      state,
      search,
      route
    }
  },
  mounted() {
    this.onSearch();
  },
  methods: {
    onSearch() {
      console.log('进来了')
      this.apiGet('/api/search', {
        query: {
          keywords: this.search.keywords,
          type: this.search.type === 'all' ? '' : this.search.type
        }
      }).then(res => {
        if (res.code === 200) {
          this.table.data = res.data;
        }
      })
    },
    // 添加 shell 脚本
    addShell() {
      console.log(this.state);
      console.log(this.route);
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
      margin-top: 6px;
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
