import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import Axios from './plugins/axios';

import {
  Button,
  message,
  notification,
  Menu,
  Table,
  Input,
  Popconfirm,
  Select,
  Tooltip,
  Modal,
  Switch
} from 'ant-design-vue';
// import 'ant-design-vue/dist/antd.css';

createApp(App)
  .use(router)
  .use(Button)
  .use(Menu)
  .use(Table)
  .use(Input)
  .use(Popconfirm)
  .use(Select)
  .use(Tooltip)
  .use(Modal)
  .use(Switch)
  .use(Axios)
  .use({
    install(app) {
      // 注册全局 api
      app.config.globalProperties.$message = message;
      app.config.globalProperties.$notification = notification;
      app.config.globalProperties.$info = Modal.info;
      app.config.globalProperties.$success = Modal.success;
      app.config.globalProperties.$error = Modal.error;
      app.config.globalProperties.$warning = Modal.warning;
      app.config.globalProperties.$confirm = Modal.confirm;
      app.config.globalProperties.$destroyAll = Modal.destroyAll;
    }
  })
  .mount('#app')
