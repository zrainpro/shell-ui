const pacote = require('pacote');

const spec = 'latest';

pacote.manifest(`shell-ui@${spec}`, {
  // always prefer latest, even if doing --tag=whatever on the cmd
  defaultTag: 'latest',
  // ...npm.flatOptions,
}).then(res => {
  // console.log(res);
  console.log(res.version);
}).catch(() => null);
