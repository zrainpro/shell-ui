const chalk = require('chalk');

module.exports = [
  {
    command: 'ls',
    alias: '',
    options: [
      { dir: '-a --all', desc: '是否显示全部指令' }
    ],
    description: `shell ls ${chalk.green('<根指令名>')} -a ${chalk.green('<指令名>')}`,
    action: require('./ls')
  },
  {
    command: 'add',
    alias: '',
    options: [
      { dir: '-f --parent <parent>', desc: '父指令名称, 不指定默认 root 根指令' },
      { dir: '-i --alias <alias>', desc: '指令简写' },
      { dir: '-d --description <description>', desc: '描述信息' },
      { dir: '-t --type <type>', desc: '指令类型, 不填写或者不支持的指令默认 shell 类型' },
    ],
    description: `shell add ${chalk.green('<指令名>')} -f ${chalk.green('<父指令名>')} -i ${chalk.green('<指令简写>')} -d ${chalk.green('<指令描述>')} -t ${chalk.green('<指令类型, 不支持的话默认shell>')} ${chalk.green('<指令内容>')}`,
    action: require('./add')
  },
  {
    command: 'edit',
    alias: '',
    options: [
      { dir: '-c --children <children>', desc: '要修改的子指令名' },
      { dir: '-n --name <name>', desc: '重新命名指令' },
      { dir: '-f --parent <parent>', desc: '父指令名称, 不指定默认 root 根指令' },
      { dir: '-i --alias <alias>', desc: '指令简写' },
      { dir: '-d --description <description>', desc: '描述信息' },
      { dir: '-t --type <type>', desc: '指令类型, 不填写或者不支持的指令默认 shell 类型' },
    ],
    description: `shell edit ${chalk.green('<根指令名>')} -c ${chalk.green('<要修改的子指令名>')} -n ${chalk.green('<要修改成的指令名>')} -f ${chalk.green('<父指令名-默认root>')} -i ${chalk.green('<指令简写>')} -d ${chalk.green('<指令描述>')} -t ${chalk.green('<指令类型, 不支持的话默认shell>')} ${chalk.green('<指令内容>')}`,
    action: require('./edit')
  },
  {
    command: 'remove',
    alias: '',
    options: [
      { dir: '-f --parent <parent>', desc: '父指令名称, 不指定默认 root 根指令' }
    ],
    description: `shell remove ${chalk.green('<指令名>')} -f ${chalk.green('<父指令名>')}`,
    action: require('./remove')
  },
  {
    command: 'delete',
    alias: '',
    options: [
      { dir: '-f --parent <parent>', desc: '父指令名称, 不指定默认 root 根指令' }
    ],
    description: `shell delete ${chalk.green('<指令名>')} -f ${chalk.green('<父指令名>')}`,
    action: require('./remove')
  },
  {
    command: 'enable',
    alias: '',
    options: [
      { dir: '-f --parent <parent>', desc: '父指令名称, 不指定默认 root 根指令' }
    ],
    description: `shell enable ${chalk.green('<指令名>')} -f ${chalk.green('<父指令名>')}`,
    action: require('./enable')
  },
  {
    command: 'forbidden',
    alias: '',
    options: [
      { dir: '-f --parent <parent>', desc: '父指令名称, 不指定默认 root 根指令' }
    ],
    description: `shell forbidden ${chalk.green('<指令名>')} -f ${chalk.green('<父指令名>')}`,
    action: require('./forbidden')
  },
  {
    command: 'import',
    alias: '',
    description: `shell import ${chalk.green('<导入的文件地址>')}`,
    action: require('./import')
  },
  {
    command: 'export',
    alias: '',
    options: [
      { dir: '-n --name <name>', desc: '导出文件名' }
    ],
    description: `shell forbidden ${chalk.green('<导出的文件路径>')}`,
    action: require('./export')
  },
  {
    command: 'clear',
    alias: '',
    description: `shell clear`,
    action: require('./clear')
  }
]
