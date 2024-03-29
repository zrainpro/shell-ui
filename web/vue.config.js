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
        target: 'http://[::1]:3001',
        changeOrigin: true,
        pathRewrite: {
        }
      },
      '/terminal': {
        target: 'http://[::1]:3001',
        pathRewrite: {
        },
        ws: true
      }
    }
  },

  configureWebpack: {
    output: {
      filename: '[name].bundle.js'
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    plugins: [
      new MonacoWebpackPlugin({
        languages: ['javascript', 'python', 'java', 'go', 'shell', 'systemverilog']
      })
    ]
  },

  // gzip 与 br 压缩
  pluginOptions: {
    compression:{
      // brotli: {
      //   filename: '[file].br[query]',
      //   algorithm: 'brotliCompress',
      //   include: /\.(js|css|html|svg|json)(\?.*)?$/i,
      //   compressionOptions: {
      //     params: {
      //       [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      //     },
      //   },
      //   minRatio: 0.8
      // },
      gzip: {
        filename: '[file].gz[query]',
        algorithm: 'gzip',
        exclude: 'index.html',
        include: /\.(js|css|html|svg|json)(\?.*)?$/i,
        minRatio: 0.8,
        deleteOriginalAssets: true
      }
    }
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
