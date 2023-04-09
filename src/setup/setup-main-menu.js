import inquirer from 'inquirer';

import setupTask from './tasks/setup-task';
import setupScrapers from './setup-scrapers';

export default async function setupMainMenu() {
  const SETUP_SCRAPER_ACTION = 'scraper';
  const SETUP_TASK_ACTION = 'task';
  const { setupType } = await inquirer.prompt({
    type: 'list',
    name: 'setupType',
    message: 'What would you like to setup?',
    choices: [
      {
        name: 'Setup a new scraper',
        value: SETUP_SCRAPER_ACTION,
      },
      {
        name: 'Setup a new task',
        value: SETUP_TASK_ACTION,
      },
    ],
  });

  switch (setupType) {
    case SETUP_SCRAPER_ACTION:
      await setupScrapers();
      break;
    case SETUP_TASK_ACTION:
      await setupTask();
      break;
    default:
      break;
  }
}
