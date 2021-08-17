# 安装
```shell script
npm i -g shell-ui
```
# 使用
## 启动可视化操作界面 
> shell start | shell # 启动交互网页
```shell script
shell -p 4000 # 在 4000 端口启动可视化操作界面, 端口被占用会自增端口
```
然后打开浏览器, 输入 localhost:3000 即可管理脚本, 支持创建 nodeJS, shell, Python, Java, Go 脚本.

## 命令行操作
### shell ls 罗列可执行指令 
> shell ls <根指令名> -a # 罗列全部的命令, 如果指定根指令则罗列该根指令的全部启用的子指令, 加上 -a 会罗列启用和禁用的指令
```shell script
shell ls # 罗列启用的根指令
shell ls -a # 罗列所用的根指令
shell ls xxx # 罗列根指令 xxx 下的启用的子指令
shell ls xxx -a # 罗列根指令 xxx 下所有的子指令
```
### shell get 获取指令的脚本内容
> shell get <指令名> -f <父指令名>
```shell script
shell get xxx # 获取根指令 xxx 的脚本内容
shell get xxx -f parent # 获取根指令 parent 下 xxx 指令的脚本内容
```
### shell add 添加指令 
> shell add <指令名> -f <父指令名> -i <指令简写> -d <指令描述> -t <指令类型, 不支持的话默认shell> <指令内容>
```shell script
shell add xxx echo hello world # 添加根指令 xxx, 指令执行内容为 echo hello world
shell add xxx -f father echo hello children # 为根指令 father 添加一个子指令 xxx, 指令执行内容为 echo hello children
```
#### 你可以添加其他的一些选项来进行更详细的设置, 如:
 - -f 或者 --parent 指定根指令的方式来添加子指令, 不指定均为添加根指令
 - -i 或者 --alias 来为指令添加简写
 - -d 或者 --description 来为指令添加描述
 - -t 或者 --type 来为指令指定脚本类型, 支持 nodeJS, shell, Python, Java, Go 脚本, 如果输入不支持的脚本类型将默认重置为 shell 脚本
 
### shell edit 编辑指令 
> shell edit <要修改的指令名> -c <要修改的子指令名> -n <要修改成的新的指令名> -f <父指令名> -i <指令简写> -d <指令描述> -t <指令类型, 不支持的话默认 shell> <指令内容>
```shell script
shell edit xxx -n xxx2 # 将根指令 xxx 改名为 xxx2
shell edit father -c xxx -n xxx2 # 将根指令 father 的子指令 xxx 改名为 xxx2
shell edit father -c xxx -f root # 将根指令 father 的子指令 xxx 改为根指令
```
> 注意: 因为根指令修改为子指令可能会丢失根指令下面的子指令, 所以禁止将根指令修改为子指令, 如需将根指令修改为子指令, 请删除根指令并且创建一个新的子指令
> 编辑的规则是 edit 跟的第一个参数是 根指令, 指明 -c 来指明子指令, -n 来标记新的指令名, 其余 option 均为修改项
#### 你可以添加其他的一些选项来进行更详细的设置, 如:
 - -c 或者 --children 指定要修改的子指令
 - -n 或者 --name 指定要修改成的新指令的名字
 - -f 或者 --parent 指定父指令名, 用于变更指令父节点或者将子指令变更为根节点(parent 设置为 root 可变更为根节点)
 - -i 或者 --alias 指定指令的简写
 - -d 或者 --description 指定指令的描述
 - -t 或者 --type 指定指令的类型, 支持 nodeJS, shell, Python, Java, Go 脚本, 如果输入不支持的脚本类型将默认重置为 shell 脚本

### shell remove 或者 shell delete 删除指令
> shell remove <指令名> -f <父指令名>
> shell delete <指令名> -f <父指令名>
```shell script
shell remove xxx # 删除根指令 xxx
shell remove xxx -f father # 删除根指令 father 下的子指令 xxx
```

### 启用禁用指令
> shell enable <指令名> -f <父指令名>
> shell forbidden <指令名> -f <父指令名>
```shell script
shell forbidden xxx # 禁用根指令 xxx
shell forbidden xxx -f father # 禁用根指令 father 下的子指令 xxx
shell enable xxx # 启用根指令 xxx
shell enable xxx -f father # 启用根指令 father 下的子指令 xxx
```

### 导入导出
> shell import <导入文件的路径>
> shell export <导出文件的路径>
```shell script
shell import ./shell-ui_database.json # 从 ./shell-ui_database.json 中导入指令
shell export /home # 导出指令数据到 /home 目录, 不指定路径默认导出到当前路径
```

### 初始化
> 一般情况下不需要使用此命令, 在你运行脚本的时候会自动执行初始化, 但如果因为某些未知原因导致初始化失败, 不能正常使用的时候, 您可以使用如下命令初始化
> 提示: 建议您初始化之前先使用 shell export 导出您当前的数据, 然后 shell clear 清除当前依赖
```shell script
shell init
```

### 清空全局数据
> 该操作会清空所有指令数据, 下载的依赖包等, 请谨慎操作, 无法正常使用该软件时可以尝试该命令然后在执行初始化
```shell script
shell clear
```

### 发布记录
release 0.1.13
- 修复升级后初次运行指令安装更新依赖失败
- 修复首页无法打开找不到问题
- 修复指令切换到 zx 提示脚本不存在
- 支持 zx 使用 js 来写脚本
- 支持在线交互的 terminal
- 在线交互 terminal 支持持久化脚本执行
- 在线交互 terminal 支持拖拽改变高度
- 在线交互 terminal 添加双击全屏展示
- js 脚本支持引入依赖
- 优化包大小, 从 12.3mb 减少到 2.1mb

