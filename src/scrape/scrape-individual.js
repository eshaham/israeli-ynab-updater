import moment from 'moment';
import inquirer from 'inquirer';

import { CONFIG_FOLDER } from '../definitions';
import { readJsonFile } from '../helpers/files';
import { decryptCredentials } from '../helpers/credentials';
import { SCRAPERS } from '../helpers/scrapers';
import { readSettingsFile, writeSettingsFile } from '../helpers/settings';
import scrape from './scrape-base';
import { generateSeparatedReports } from './generate-reports';

async function getParameters(
  defaultSaveLocation,
  includeFutureTransactions,
  includePendingTransactions,
) {
  const startOfMonthMoment = moment().startOf('month');
  const monthOptions = [];
  for (let i = 0; i < 6; i += 1) {
    const monthMoment = startOfMonthMoment.clone().subtract(i, 'month');
    monthOptions.push({
      name: monthMoment.format('ll'),
      value: monthMoment,
    });
  }
  const result = await inquirer.prompt([
    {
      type: 'list',
      name: 'scraperId',
      message: 'Which bank would you like to scrape?',
      choices: Object.keys(SCRAPERS).map((id) => {
        return {
          name: SCRAPERS[id].name,
          value: id,
        };
      }),
    },
    {
      type: 'confirm',
      name: 'combineInstallments',
      message: 'Combine installment transactions?',
      default: true,
    },
    {
      type: 'list',
      name: 'startDate',
      message: 'What date would you like to start scraping from?',
      choices: monthOptions,
    },
    {
      type: 'input',
      name: 'saveLocation',
      message: 'Save folder?',
      default: defaultSaveLocation,
    },
    {
      type: 'confirm',
      name: 'includeFutureTransactions',
      message: 'Include future transactions?',
      default: !!includeFutureTransactions,
    },
    {
      type: 'confirm',
      name: 'includePendingTransactions',
      message: 'Include pending transactions?',
      default: !!includePendingTransactions,
    },
  ]);
  return result;
}


export default async function (showBrowser) {
  const settings = await readSettingsFile();
  const {
    scraperId,
    combineInstallments,
    startDate,
    saveLocation,
    includeFutureTransactions,
    includePendingTransactions,
  } = await getParameters(
    settings.saveLocation,
    settings.includeFutureTransactions,
    settings.includePendingTransactions,
  );

  settings.saveLocation = saveLocation;
  settings.includeFutureTransactions = includeFutureTransactions;
  settings.includePendingTransactions = includePendingTransactions;
  await writeSettingsFile(settings);

  const encryptedCredentials = await readJsonFile(`${CONFIG_FOLDER}/${scraperId}.json`);
  if (encryptedCredentials) {
    const credentials = decryptCredentials(encryptedCredentials);
    const options = {
      startDate: startDate.toDate(),
      combineInstallments,
      showBrowser,
    };

    try {
      const scrapedAccounts = await scrape(scraperId, credentials, options);
      await generateSeparatedReports(
        scrapedAccounts,
        saveLocation,
        includeFutureTransactions,
        includePendingTransactions,
      );
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log('Could not find credentials file');
  }
}
