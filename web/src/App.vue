<template>
  <div id="app" :style="`min-width: ${state.collapsed ? '744px' : '884px'}`">
    <div class="menu" :style="`width: ${state.collapsed ? '80px' : '220px'}`">
      <div class="nav-item" @click.stop="state.collapsed = !state.collapsed">
        <a-tooltip placement="right">
          <UnorderedListOutlined />
        </a-tooltip>
      </div>
      <a-menu
          v-model:selectedKeys="menu.selectedKeys"
          mode="inline"
          theme="light"
          :inline-collapsed="state.collapsed"
      >
        <a-menu-item @click="clickMenu(item)" :key="item.path" v-for="item in menu.list">
          <router-link :to="item.path">
            <span>
              <component :is="item.icon"></component>
              <span>{{item.name}}</span>
            </span>
          </router-link>
        </a-menu-item>
      </a-menu>
    </div>
    <div class="content">
      <router-view v-slot="{ Component }">
        <transition>
          <component :is="Component"></component>
        </transition>
      </router-view>
    </div>
  </div>
</template>
<script>
  import { reactive, onMounted } from 'vue';
  import { BlockOutlined, CodeOutlined, SettingOutlined, UnorderedListOutlined } from '@ant-design/icons-vue';

  export default {
    components: {
      BlockOutlined,
      CodeOutlined,
      SettingOutlined,
      UnorderedListOutlined
    },
    setup() {
      // 声明菜单数据
      const menu = reactive({
        selectedKeys: ['/'],
        active: { name: '脚本管理', path: '/' },
        list: [
          { name: '脚本管理', path: '/manage', icon: BlockOutlined },
          // { name: 'shell', path: '/shell', icon: CodeOutlined },
          // { name: '设置', path: '/setting', icon: SettingOutlined }
        ]
      });
      // mounted 的时候修改 菜单项
      onMounted(() => {
        menu.active = menu.list.find(_ => new RegExp(`^${_.path}`).test(location.pathname));
        menu.selectedKeys = [menu.active.path];
      });

      const state = reactive({
        collapsed: true
      });

      return {
        menu,
        state
      }
    },
    methods: {
      clickMenu(item) {
        this.menu.active = item;
        this.menu.selectedKeys = [item.path];
      }
    }
  }
</script>
<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100vw;
  height: 100vh;
}
.menu {
  width: 220px;
  height: 100vh;
  box-shadow: rgba(0, 0, 0, 0.1) 2px 0px 10px;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  background: rgb(255, 255, 255);
  .nav-item {
    width: 100%;
    height: 40px;
    line-height: 40px;
    text-align: center;
    &:hover {
      color: #1da57a;
    }
  }
}
.content {
  flex: 1;
  height: 100vh;
  overflow: auto;
  padding: 16px;
  background: rgb(187, 230, 214);
}
a {
  color: #42b983;
}

</style>
