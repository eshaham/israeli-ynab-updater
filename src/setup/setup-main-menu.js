import inquirer from 'inquirer';

import setupTask from './setup-task';
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
      {
        name: 'Setup a new tasks',
        value: 'task',
      },
    ],
  });

  switch (setupType) {
    case 'scraper':
      setupScrapers();
      break;
    case 'task':
      setupTask();
      break;
    default:
      break;
  }
}
