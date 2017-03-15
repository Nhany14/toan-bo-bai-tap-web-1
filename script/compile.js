#! /usr/bin/env node
'use strict'

const {dirname, join, parse} = require('path')
const {readdirSync, readFileSync, statSync, mkdirSync, writeFileSync} = require('fs')
const {info} = global.console
const jtry = require('just-try')
const rgxmap = require('./build-rules.js')
const projdir = dirname(__dirname)
const src = join(projdir, 'src')
const out = join(projdir, 'out')
const lib = join(projdir, 'lib')

compile(src, out, 0)
info('done.')

function compile (source, target, level) {
  const stats = statSync(source)
  if (stats.isDirectory()) {
    jtry(() => statSync(target).isDirectory(), () => false) || mkdirSync(target)
    readdirSync(source).forEach(item => compile(join(source, item), join(target, item), level + 1))
  } else if (stats.isFile()) {
    const sourcecode = readFileSync(source)
    const {dir, name} = parse(target)
    rgxmap.some(([regex, suffix, compile]) => {
      if (!regex.test(source)) return false
      const target = join(dir, name + suffix)
      const sourcemtime = stats.mtime
      const targetmtime = jtry(() => statSync(target).mtime, () => -Infinity)
      if (sourcemtime > targetmtime) {
        const locals = {projdir, src, out, source, target, dir, name, sourcecode, require, getlib, jreq, sourcemtime, targetmtime}
        console.info(':: Compiling ' + source)
        const output = compile(sourcecode, locals)
        writeFileSync(target, output)
        console.info('-- Created ' + target)
        return true
      } else {
        console.info(':: Skiping ' + source)
        return true
      }
    }) || updateVersion(target, source)
  } else {
    throw new Error(`Invalid type of fs entry: ${source}`)
  }
}

function getlib (...name) {
  return jreq(lib, ...name)
}

function jreq (...name) {
  return require(join(...name))
}

function updateVersion () {}
