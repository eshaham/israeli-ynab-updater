import moment from 'moment';
import inquirer from 'inquirer';
import colors from 'colors/safe';
import { DATE_TIME_FORMAT } from '../constants';
import { decryptCredentials } from '../helpers/credentials';
import scrape from './scrape-base';
import { TasksManager, printTaskSummary } from '../helpers/tasks';
import { generateSingleReport, generateSeparatedReports } from './generate-reports';

const tasksManager = new TasksManager();

async function getParameters() {
  const availableTasks = await tasksManager.getTasksList();

  if (availableTasks && availableTasks.length) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'taskName',
        message: 'Select a task to execute',
        validate: (answer) => {
          if (!answer) {
            return 'Task name must be provided';
          }
          return true;
        },
        choices: [...availableTasks],
      },
    ]);

    return { taskName: answers.taskName };
  }

  console.log(colors.notify('No tasks created, please run command \'npm run setup\' to create a task'));
  return { taskName: null };
}

export default async function (showBrowser) {
  const { taskName } = await getParameters();

  if (taskName) {
    console.log(colors.title(`Running task '${taskName}'`));
    const taskData = await tasksManager.loadTask(taskName);
    const scrapersOfTask = taskData.scrapers || [];

    if (scrapersOfTask.length === 0) {
      console.log(colors.notify('Task has no scrapers defined.\nplease run command \'npm run setup\' and update task scrapers'));
      return;
    }

    printTaskSummary(taskData, true);

    const {
      dateDiffByMonth,
      combineInstallments,
    } = taskData.options;
    const {
      combineReport,
      saveLocation: saveLocationRootPath,
      includeFutureTransactions,
      includePendingTransactions,
    } = taskData.output;
    const substractValue = dateDiffByMonth - 1;
    const startMoment = moment().subtract(substractValue, 'month').startOf('month');
    const reportAccounts = [];

    console.log(colors.title('Run task scrapers'));

    for (let i = 0; i < scrapersOfTask.length; i += 1) {
      const scraperOfTask = scrapersOfTask[i];
      const credentials = decryptCredentials(scraperOfTask.credentials);

      const options = {
        companyId: scraperOfTask.id,
        startDate: startMoment,
        combineInstallments,
        showBrowser,
        verbose: false,
      };

      try {
        const scrapedAccounts = await scrape(scraperOfTask.id, credentials, options);
        reportAccounts.push(...scrapedAccounts);
      } catch (e) {
        console.error(e);
        throw e;
      }
    }

    if (combineReport) {
      const saveLocation = `${saveLocationRootPath}/tasks/${taskName}`;
      await generateSingleReport(
        reportAccounts,
        saveLocation,
        includeFutureTransactions,
        includePendingTransactions,
      );
    } else {
      const currentExecutionFolder = moment().format(DATE_TIME_FORMAT);
      const saveLocation = `${saveLocationRootPath}/tasks/${taskName}/${currentExecutionFolder}`;
      await generateSeparatedReports(
        reportAccounts,
        saveLocation,
        includeFutureTransactions,
        includePendingTransactions,
      );
    }
  }
}
