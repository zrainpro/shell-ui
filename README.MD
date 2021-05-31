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
release 0.1.5
- 支持自定义端口启动 -p
- 支持命令行操作
  - shell start | shell # 启动交互网页
  - shell ls <根指令名> -a # 罗列全部的命令, 如果指定根指令则罗列该根指令的全部启用的子指令, 加上 -a 会罗列启用和禁用的指令
  - shell add <指令名> -f <父指令名> -i <指令简写> -d <指令描述> -t <指令类型, 不支持的话默认shell> <指令内容>
  - shell edit <要修改的指令名> -c <要修改的子指令名> -n <要修改成的新的指令名> -f <父指令名> -i <指令简写> -d <指令描述> -t <指令类型, 不支持的话默认 shell> <指令内容>
  - shell remove <指令名> -f <父指令名>
  - shell delete <指令名> -f <父指令名>
  - shell enable <指令名> -f <父指令名>
  - shell forbidden <指令名> -f <父指令名>
  - shell import <导入文件的路径>
  - shell export <导出文件的路径>
- 升级依赖
release 0.1.4
- 支持 window 系统
- 修复初始化的时候没有安装完依赖导致脚本不能执行
- 修复 centos 下脚本执行失败(文件结尾符号要是 ff unix 的)
- 升级 web 端依赖版本
- 支持检测版本并提示用户升级使用

release 0.1.1
- 修复若干 bug
- 前端脚本筛选支持 python/java/go
