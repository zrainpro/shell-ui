const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
            'primary-color': '#1DA57A',
            'link-color': '#42b983',
            'border-radius-base': '2px',
          },
          javascriptEnabled: true
        }
      }
    }
  },

  devServer: {
    proxy: {
      '/api': {
        target: 'http://[::1]:3000',
        changeOrigin: true,
        pathRewrite: {
        }
      }
    }
  },

  configureWebpack: {
    plugins: [
      new MonacoWebpackPlugin()
    ]
  },

  outputDir: '../server/web',

  // 网页标题
  chainWebpack: (config) => {
    config
      .plugin('html')
      .tap((args) => {
        args[0].title = 'shellUI';
        return args;
      });
  },

  productionSourceMap: false
}
