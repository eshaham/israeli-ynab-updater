import inquirer from 'inquirer';
import scrapeIndividual from './scrape-individual';
import scrapeTask from './scrape-task';

export default async function (showBrowser) {
  const { scrapeType } = await inquirer.prompt({
    type: 'list',
    name: 'scrapeType',
    message: 'What would you like to do?',
    choices: [
      {
        name: 'Run an individual scraper',
        value: 'individual',
      },
      {
        name: 'Run a task',
        value: 'task',
      },
    ],
  });

  switch (scrapeType) {
    case 'individual':
      await scrapeIndividual(showBrowser);
      break;
    case 'task':
      await scrapeTask(showBrowser);
      break;
    default:
      break;
  }
}
