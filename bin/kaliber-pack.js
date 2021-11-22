#!/usr/bin/env node
import meow from 'meow'
import path from 'path'
import url from 'url'
import { npmRunPathEnv } from 'npm-run-path'
import childProcess from 'child_process'

const help = `
Usage
  $ kaliber-pack [<dir>]
Options
  --watch       Watch for changes and recompile
  --verbose     Log more
  --help        Output usage information
Examples
  # Build the plugin in the current directory
  $ kaliber-pack
  # Build the plugin and recompile automatically on changes
  $ kaliber-pack --watch
`

const flags = {
  verbose: {
    type: 'boolean',
    default: false,
  },
  watch: {
    type: 'boolean',
    default: false,
  }
}

const cli = meow(help, { flags, importMeta: import.meta })
const basePath = path.resolve(cli.input[0] || process.cwd())

console.log('Compiling plugin:')
console.log(`Input:  ${path.join(basePath, './src')}`)
console.log(`Output: ${path.join(basePath, './lib')}`)

if (cli.flags.watch) console.log('Watching for changes...')

run(async () => {
  return new Promise((resolve, reject) => {
    const babelConfigFile = path.join(
      path.dirname(url.fileURLToPath(import.meta.url)),
      '..',
      'config',
      'babelrc.js',
    )
    childProcess.spawn(
      'babel',
      [
        '--copy-files',
        '--delete-dir-on-start',
        cli.flags.watch && '--watch',
        cli.flags.verbose && '--verbose',
        '--config-file', babelConfigFile,
        '--extensions', '.js',
        '--source-maps', 'true',
        '--out-dir', './lib',

        './src',
      ].filter(Boolean),
      {
        env: npmRunPathEnv(),
        stdio: 'inherit',
      }
    ).on('error', reject).on('close', resolve)
  })
})

async function run(f) {
  f()
    .then(code => { if (code) console.log('Error during execution'); process.exit(code) })
    .catch(e => { console.error(e); process.exit(1) })
}
