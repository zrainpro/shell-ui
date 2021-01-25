'use strict';
const fs = require('fs');
const path = require('path');

const controller = {};
const paths = fs.readdirSync(path.resolve(__dirname, '../controller'));

paths.forEach(file => {
  const name = file.replace(/\.js$/g, '');
  const itemPath = path.resolve(__dirname, `../controller/${file}`);
  if (fs.existsSync(itemPath)) {
    const TempClass = require(itemPath);
    const instance = new TempClass();
    controller[name] = {};
    const funcs = Object.getOwnPropertyNames(TempClass.prototype).filter(item => item !== 'constructor' && item !== '__proto__');
    funcs.forEach(func => {
      controller[name][func] = async (ctx, next) => {
        await instance[func].call(instance, ctx, next)
      }
    });
  }
});

module.exports = controller;
