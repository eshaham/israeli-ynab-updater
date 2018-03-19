import inquirer from 'inquirer';

import setupTask from './tasks/setup-task';
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
        name: 'Setup a new task',
        value: 'task',
      },
    ],
  });

  switch (setupType) {
    case 'scraper':
      await setupScrapers();
      break;
    case 'task':
      await setupTask();
      break;
    default:
      break;
  }
}
