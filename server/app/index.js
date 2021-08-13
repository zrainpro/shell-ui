'use strict';
const Koa = require('koa');
const koaBody = require('koa-body');
const send = require('koa-send');
const websockify = require('koa-websocket');
const fs = require('fs');
const path = require('path');
const router = require('./router');
const runApp = require('./utils/run');
const execCommand = require('./ws/exec');

module.exports = (port = 3000) => {
  const app = websockify(new Koa());
// app.use(bodyParser());

  execCommand(app); // websocket

  app.use(koaBody({ multipart: true }))
  app.use(async function(ctx, next) {
    if ((new RegExp('^/api')).test(ctx.url)) {
      try {
        // 处理接口
        await next();
      } catch (err) {
        console.log('error message >>> ', err.message);
        ctx.body = {
          code: 0,
          message: err.message
        }
      }
    } else {
      const paths = ctx.path;
      const dirPath = path.resolve(__dirname, '../web' + paths);
      if (
          (ctx.acceptsEncodings('br', 'identity') === 'br' && fs.existsSync(dirPath + '.br')) ||
          (ctx.acceptsEncodings('gzip', 'identity') === 'gzip' && fs.existsSync(dirPath + '.gz')) ||
          fs.existsSync(dirPath)
      ) {
        await send(ctx, path.resolve(__dirname, '../web' + paths), {
          root: '/',
          index: 'index.html',
          hidden: true,
          gzip: true,
          br: true
        })
      } else {
        await send(ctx, path.resolve(__dirname, '../web/index.html'), {
          root: '/',
          index: 'index.html',
          hidden: true,
          gzip: true,
          br: true
        })
      }
    }
  });
  app.use(router.routes());
// runApp(3000, app);
  runApp(port, app);
}
