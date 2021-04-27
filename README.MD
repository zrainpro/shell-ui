# 安装
```shell script
npm i -g shell-ui
```
# 使用
```shell script
shell
```
然后打开浏览器, 输入 localhost:3000 即可管理脚本, 支持创建 nodeJS, shell, Python, Java, Go 脚本.

### 发布记录
release 0.1.4
- 支持 window 系统
- 修复初始化的时候没有安装完依赖导致脚本不能执行
- 修复 centos 下脚本执行失败(文件结尾符号要是 ff unix 的)
- 升级 web 端依赖版本
- 支持检测版本并提示用户升级使用

release 0.1.1
- 修复若干 bug
- 前端脚本筛选支持 python/java/go
