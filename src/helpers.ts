import * as validator from 'is-my-json-valid'
import * as rc from 'rc'
import { Config, schema } from './config-schema'

export const validateConfig = (config: Config) => {
  const validate = validator(schema)
  validate(config)
  if (validate.errors) {
    const errors = validate.errors.map(error => `${error.field} ${error.message}`)
    throw new Error(`Invalid .backstagerc:\n${errors.join('\n')}`)
  }
}

export const getConfig = (() => {
  let cachedConfig: any

  return (): Config => {
    if (!cachedConfig) {
      cachedConfig = rc('backstage', {
        tempDirectory: '/tmp',
      })
    }

    validateConfig(cachedConfig)

    return cachedConfig
  }
})()

export const handleError = (message: string) => (error: any) => {
  // tslint:disable:no-console
  console.error(message)
  if (error) {
    console.error('\n')
    console.error(error)
  }
  // tslint:enable:no-console

  process.exit(1)
}
