'use strict';
import axios from 'axios';
import { message } from 'ant-design-vue';

// Full config:  https://github.com/axios/axios#request-config
// axios.defaults.baseURL = process.env.baseURL || process.env.apiUrl || '';
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

const config = {
  // baseURL: process.env.baseURL || process.env.apiUrl || ""
  // timeout: 60 * 1000, // Timeout
  // withCredentials: true, // Check cross-site Access-Control
};

const _axios = axios.create(config);

_axios.interceptors.request.use(
  function(config) {
    // Do something before request is sent
    return config;
  },
  function(error) {
    // Do something wit
    return Promise.reject(error);
  }
);

// Add a response interceptor
_axios.interceptors.response.use(
  function(response) {
    const data = response.data;
    if (data.code === 0) {
      message.error(data.message)
      return data;
    } else {
      return data;
    }
  },
  function(error) {
    return Promise.reject(error);
  }
);

Plugin.install = function(app) {
  app.axios = _axios;
  app.config.globalProperties.axios = _axios
  window.axios = _axios;
  Object.defineProperties(app.config.globalProperties, {
    axios: {
      get() {
        return _axios;
      }
    },
    $axios: {
      get() {
        return _axios;
      }
    },
    apiGet: {
      get () {
        return _axios.get;
      }
    },
    apiPost: {
      get () {
        return _axios.post;
      }
    },
    apiDelete: {
      get () {
        return _axios.delete;
      }
    }
  });
};

export default Plugin;
