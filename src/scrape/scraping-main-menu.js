import inquirer from 'inquirer';
import scrapeIndividual from './scrape-individual';
import scrapeTask from './scrape-task';

async function selectAction(showBrowser) {
  const RUN_SCRAPER_ACTION = 'scraper';
  const RUN_TASK_ACTION = 'task';

  const { scrapeType } = await inquirer.prompt({
    type: 'list',
    name: 'scrapeType',
    message: 'What would you like to do?',
    choices: [
      {
        name: 'Run an individual scraper',
        value: RUN_SCRAPER_ACTION,
      },
      {
        name: 'Run a task',
        value: RUN_TASK_ACTION,
      },
    ],
  });

  switch (scrapeType) {
    case RUN_SCRAPER_ACTION:
      await scrapeIndividual(showBrowser);
      break;
    case RUN_TASK_ACTION:
      await scrapeTask(showBrowser);
      break;
    default:
      break;
  }
}

export default async function (showBrowser, taskName) {
  if (taskName) {
    await scrapeTask(showBrowser, taskName);
  } else {
    selectAction(showBrowser);
  }
}
