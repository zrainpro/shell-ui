// const shell = require('shelljs');
//
// const out = shell.exec('node ./index.js', function (code, stdout) {
//   // console.log(stdout, 'stdout')
// })
// out.stdout.on('data', function (data) {
//   // console.log(data, 'data');
// })

// ######
// const { exec } = require('child_process');
// const ls = exec('npm i -g npm');
//
// ls.stdout.on('data', (data) => {
//   console.log(`stdout: ${data} ---end`);
// });

// ls.stderr.on('data', (data) => {
//   console.error(`stderr: ${data}`);
// });
//
// ls.on('close', (code) => {
//   console.log(`子进程退出，退出码 ${code}`);
// });


// const net = require('net');
// const repl = require('repl');
// let connections = 0;
//
// repl.start({
//   prompt: 'Node.js 使用 stdin> ',
//   input: process.stdin,
//   output: process.stdout
// });

const repl = require('repl');
// const { Translator } = require('translator');

// const myTranslator = new Translator('en', 'fr');

function myEval(cmd, context, filename, callback) {
  console.log(cmd, context, filename)
  callback(null, cmd);
}

repl.start({ prompt: '> ', eval: myEval });
