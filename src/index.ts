#! /usr/bin/env node
import { execSync } from 'child_process'
import * as program from 'commander'
import * as fs from 'fs'
import * as request from 'request'
import * as tar from 'tar'

import * as packageJSON from '../package.json'
import init from './commands/init'
import { getConfig, handleError } from './helpers'
import { Config } from './config-schema'

let config: Config

try {
  config = getConfig()
}
catch (e) {
  console.warn("Failed to load config, use `backstage init`")
}

const uploadStream = (file: string, key: string, callback?: request.RequestCallback) => {
  const uploadRequest = request.post(`${config.server}/__backstage/deploy/${config.app}/${key}`, callback)

  uploadRequest.form().append(
    'package',
    fs.createReadStream(file),
    { filename: 'package.tar.gz' },
  )
}

const uploadCallback = (error: any, response: request.Response, body: any) => {
  if (error) {
    handleError('There was an error uploading your package:')(error)
  }

  try {
    const { message } = JSON.parse(body)
    console.log(message) // tslint:disable-line:no-console
  } catch (error) {
    handleError('There was an error parsing the response from the server:')(error)
  }
}

let defaultBranchName: String = "master";
try {
  defaultBranchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
} catch (e) {
  // use 'master' as the default
}

program
  .command('deploy')
  .option(
    '-k, --key <key>',
    'Specify the key to deploy (by default, the current Git branch name)',
    defaultBranchName,
  )
  .action(command => {
    const file = `${config.tempDirectory}/backstage-package-${new Date().toISOString()}.tar.gz`
    const key = command.key.replace(/\W/g, '-')
    const packageStream = tar.create({ cwd: config.buildDirectory, file, gzip: true }, ['.'])
      .then(() => uploadStream(file, key, uploadCallback))
      .catch(handleError('There was an error when packaging your build directory:'))
  })

init(program)

program
  .version(packageJSON.version)
  .parse(process.argv)