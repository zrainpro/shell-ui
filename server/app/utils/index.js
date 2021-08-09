'use strict';
const { reLoadPackage, buildShell, deletePackageShell, deletePackage } = require('./bin/package');
const createInstruct = require('./bin/create');
const editInstruct = require('./bin/edit');
const removeInstruct = require('./bin/remove');
const getInstructFromName = require('./bin/get');
const enableInstruct = require('./bin/enable');
const importInstruct = require('./bin/import');

// todo 如果是 nodeJS npm 包抽离出来并安装 npm 模块, 使支持 npm 模块
async function installNpmModule({ params, json }) {
  const modules = getNodeModules(params.command); // 获取要引入的 npm 模块
  // 所有指令用到的 npm 模块统一放到根指令的 nodeModules 字段中, nodeModules 字段不可重复
  // 每个指令执行位置都加一个 node_module 安装的 package.json, 为每个指令添加一个执行环境
}
// 获取 js 脚本的 node-modules 模块
function getNodeModules(command = '') {
  // 剔除掉 node 原生模块 以 v14.15.4 为准
  const nodeModules = ['assert', 'async_hooks', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'util', 'tls', 'trace_events', 'tty', 'url', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib'];
  return (command.match(/require\(['"][^'"]+["']\)/g) || []).map(item => item.replace(/require\(['"]/g, '').replace(/['"]\)/g, '')).filter(item => !nodeModules.includes(item));
}

module.exports = {
  reLoadPackage,
  buildShell,
  deletePackageShell,
  createInstruct,
  editInstruct,
  removeInstruct,
  getInstructFromName,
  enableInstruct,
  importInstruct
}
