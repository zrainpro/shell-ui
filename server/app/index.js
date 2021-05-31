'use strict';
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const koaBody = require('koa-body');
const send = require('koa-send');
const fs = require('fs');
const path = require('path');
const initShellUI = require('./init');
const router = require('./router');
const runApp = require('./utils/run');

initShellUI();
const app = new Koa();
// app.use(bodyParser());
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
    if (fs.existsSync(dirPath)) {
      await send(ctx, path.resolve(__dirname, '../web' + paths), { root: '/', index: 'index.html', hidden: true })
    } else {
      await send(ctx, path.resolve(__dirname, '../web/index.html'), { root: '/', index: 'index.html', hidden: true })
    }
  }
});
app.use(router.routes());
// runApp(3000, app);
module.exports = (port = 3000) => {
  runApp(port, app);
}
