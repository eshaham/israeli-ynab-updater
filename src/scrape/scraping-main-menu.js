import inquirer from 'inquirer';
import scrapeIndividual from './scrape-individual';
import scrapeTask from './scrape-task';

export default async function (showBrowser, runTask) {
  const RUN_SCRAPER_ACTION = 'scraper';
  const RUN_TASK_ACTION = 'task';

  let scrapeType;
  if (runTask) {
    scrapeType = RUN_TASK_ACTION;
  } else {
    const { scrapeType: scrapeTypePrompt } = await inquirer.prompt({
      type: "list",
      name: "scrapeType",
      message: "What would you like to do?",
      choices: [
        {
          name: "Run an individual scraper",
          value: RUN_SCRAPER_ACTION,
        },
        {
          name: "Run a task",
          value: RUN_TASK_ACTION,
        },
      ],
    });

    scrapeType = scrapeTypePrompt;
  }

  switch (scrapeType) {
    case RUN_SCRAPER_ACTION:
      await scrapeIndividual(showBrowser);
      break;
    case RUN_TASK_ACTION:
      await scrapeTask(showBrowser, runTask);
      break;
    default:
      break;
  }
}
