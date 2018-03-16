import moment from 'moment';
import json2csv from 'json2csv';

import { TASKS_FOLDER } from '../definitions';
import { writeFile, readJsonFile } from '../helpers/files';
import { decryptCredentials } from '../helpers/credentials';
import scrape from './scrape-base';

async function createResultFiles(task, taskName, scrapedAccounts) {
  console.log(`creating output files for task ${taskName} `);
  console.log(`task output: ${JSON.stringify(task.output)}`);

  const saveLocation = `${task.output.saveLocation}/tasks/${taskName}`;
  console.log(`save location${saveLocation}`);

  if (task.output.combine) {
    const fileTransactions = scrapedAccounts.reduce((acc, account) => {
      acc.push(...account.txns);
      return acc;
    }, []);
    const filePath = `${saveLocation}/${moment().format('DD-MM-YYYY_HH-mm-ss')}.csv`;
    const fileFields = ['Institude', 'Account', 'Date', 'Payee', 'Inflow', 'Installment', 'Total'];
    const fileContent = json2csv({ data: fileTransactions, fileFields, withBOM: true });
    await writeFile(filePath, fileContent);
    console.log(`created file ${filePath}`);
  }
}

export default async function (showBrowser) {
  const taskName = 'demo';
  const task = await readJsonFile(`${TASKS_FOLDER}/${taskName}.json`);

  if (task) {
    const scrapersOfTask = task.scrapers || [];

    const {
      dateDiffByMonth,
      combineInstallments,
    } = task.options;

    const startDate = moment().subtract(dateDiffByMonth, 'month').startOf('month');
    console.log(`scrapper is configured with start date '${startDate.format('DD-MM-YYYY')}'`);

    const scrapedAccounts = [];
    for (let i = 0; i < scrapersOfTask.length; i += 1) {
      const scraperOfTask = scrapersOfTask[i];
      const credentials = decryptCredentials(scraperOfTask.credentials);

      const options = {
        companyId: scraperOfTask.id,
        startDate,
        combineInstallments,
        showBrowser,
        verbose: false,
      };

      try {
        scrapedAccounts.push(...await scrape(scraperOfTask.id, credentials, options));
      } catch (e) {
        console.log('error:', e.message);
        process.exit(1);
      }
    }

    await createResultFiles(task, taskName, scrapedAccounts);
  } else {
    // TODO consider halting the application
    console.error(`task '${taskName} is missing`);
  }
}
