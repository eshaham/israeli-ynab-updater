// import inquirer from 'inquirer';

// import scrapeIndividual from './scrape-individual';
import scrapeTask from './scrape-task';

export default async function () {
  await scrapeTask();
  //
  // const { next } = await inquirer.prompt({
  //   type: 'list',
  //   name: 'next',
  //   message: 'What would you like to do?',
  //   choices: [
  //     {
  //       name: 'Run an individual scraper',
  //       value: scrapeIndividual,
  //     },
  //     {
  //       name: 'Run a task',
  //       value: scrapeTask,
  //     },
  //   ],
  // });
  //
  // await next();
}
