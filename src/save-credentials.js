import inquirer from 'inquirer';

import PASSWORD_FIELD from './constants';
import { CONFIG_FOLDER } from './definitions';
import { SCRAPERS } from './helpers/scrapers';
import { writeJsonFile } from './helpers/files';
import { encryptCredentials } from './helpers/credentials';

function validateNonEmpty(field, input) {
  if (input) {
    return true;
  }
  return `${field} must be non empty`;
}

async function scraperSetup() {
  const scraperNameResult = await inquirer.prompt([{
    type: 'list',
    name: 'scraperName',
    message: 'Which scraper would you like to save credentials for?',
    choices: Object.keys(SCRAPERS).map((id) => {
      return {
        name: SCRAPERS[id].name,
        value: id,
      };
    }),
  }]);
  const { loginFields } = SCRAPERS[scraperNameResult.scraperName];
  const questions = loginFields.map((field) => {
    return {
      type: field === PASSWORD_FIELD ? PASSWORD_FIELD : 'input',
      name: field,
      message: `Enter value for ${field}:`,
      validate: input => validateNonEmpty(field, input),
    };
  });
  const credentialsResult = await inquirer.prompt(questions);
  const encryptedCredentials = encryptCredentials(credentialsResult);
  await writeJsonFile(`${CONFIG_FOLDER}/${scraperNameResult.scraperName}.json`, encryptedCredentials);
  console.log(`credentials file saved for ${scraperNameResult.scraperName}`);
}

async function oxrSetup() {
  const { appId } = await inquirer.prompt({
    type: 'input',
    name: 'appId',
    message: 'Enter your openexchangerates.org app id (get one for free by creating a new account):',
    validate: input => validateNonEmpty('app id', input),
  });

  const encryptedAppId = encryptCredentials({ appId });
  await writeJsonFile(`${CONFIG_FOLDER}/openexchangerates.json`, encryptedAppId);
  console.log('credentials file saved for openexchangerates.org');
}

export default async function () {
  const { next } = await inquirer.prompt({
    type: 'list',
    name: 'next',
    message: 'What would you like to setup?',
    choices: [
      {
        name: 'Scrapers',
        value: scraperSetup,
      },
      {
        name: 'Currency Convention',
        value: oxrSetup,
      },
    ],
  });

  await next();
}
