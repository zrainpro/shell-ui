# 安装
```shell script
npm i -g shell-ui
```
# 使用
```shell script
shell
```
然后打开浏览器, 输入 localhost:3000 即可管理脚本, 支持创建 nodeJS, shell, Python, Java, Go 脚本.
# todo
- 支持 npm 包引入
- 支持执行文件上传

### 发布记录
release 0.1.2
- 支持 window 系统
- 修复初始化的时候没有处理完就退出脚本导致脚本不能执行
- 修复 centos 下脚本执行失败(文件结尾符号要是 ff unix 的)
release 0.1.1
- 修复若干 bug
- 前端脚本筛选支持 python/java/go
