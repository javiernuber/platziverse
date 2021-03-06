'use strict'

const db = require('./')
const debug = require('debug')('platziverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')

const prompt = inquirer.createPromptModule()

async function setup () {
  const force = process.argv.slice(2).pop()
  if (force !== '-y') {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'setup',
        message: 'This will destroy your database, are you sure?'
      }
    ])
  
    if (!answer.setup) {
      return console.log('Nothing happpen :)')
    }
  }  

  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || '1234',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    login: s => debug(s),
    setup: true
  }

  await db(config).catch(handleFatalError)

  console.log('Succes!!')
  process.exit(0)
}

function handleFatalError (err) {
  console.error(`${chalk.red('[Fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

setup()
