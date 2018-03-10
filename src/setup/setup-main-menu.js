import inquirer from 'inquirer';

import setupScrapers from './setup-scrapers';

export default async function () {
  const { setupType } = await inquirer.prompt({
    type: 'list',
    name: 'setupType',
    message: 'What would you like to setup?',
    choices: [
      {
        name: 'Setup a new scraper',
        value: 'scraper',
      },
    ],
  });

  switch (setupType) {
    case 'scraper':
      setupScrapers();
      break;
    default:
      break;
  }
}
