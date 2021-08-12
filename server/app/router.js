'use strict';
const router = require('koa-router')();
const controller = require('./utils/controller');

// 搜索脚本
router.get('/api/search', controller.search.index)
// 获取根脚本数据 选择的下拉框
router.get('/api/root', controller.search.root);
// 获取单个脚本的数据
router.get('/api/shell/:id', controller.search.single);
// 创建脚本
router.post('/api/create', controller.edit.create)
// 编辑脚本
router.post('/api/edit', controller.edit.edit)
// 删除脚本
router.post('/api/delete/:id', controller.edit.remove);
// 启用 / 禁用脚本
router.post('/api/enable', controller.edit.enable);
// 导出脚本
router.get('/api/export', controller.export.export);
// 导入脚本
router.post('/api/import', controller.export.import);
// 执行脚本
router.post('/api/exec', controller.exec.exec);
// home 路径地址
router.get('/api/homedir', controller.exec.homeDir)

module.exports = router;
