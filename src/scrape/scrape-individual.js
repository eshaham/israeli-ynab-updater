import moment from 'moment';
import inquirer from 'inquirer';

import { CONFIG_FOLDER } from '../definitions';
import { readJsonFile } from '../helpers/files';
import { decryptCredentials } from '../helpers/credentials';
import { SCRAPERS } from '../helpers/scrapers';
import { readSettingsFile, writeSettingsFile } from '../helpers/settings';
import scrape from './scrape-base';
import { generateSeparatedReports } from './generate-reports';

async function getParameters() {
  const settings = await readSettingsFile();
  const {
    combineInstallments,
    saveLocation,
    includeFutureTransactions,
    includePendingTransactions,
  } = settings;

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
      default: !!combineInstallments,
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
      default: saveLocation,
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

  settings.combineInstallments = result.combineInstallments;
  settings.startDate = result.startDate;
  settings.saveLocation = result.saveLocation;
  settings.includeFutureTransactions = result.includeFutureTransactions;
  settings.includePendingTransactions = result.includePendingTransactions;
  await writeSettingsFile(settings);

  return result;
}

export default async function (showBrowser) {
  const {
    scraperId,
    combineInstallments,
    startDate,
    saveLocation,
    includeFutureTransactions,
    includePendingTransactions,
  } = await getParameters();

  const encryptedCredentials = await readJsonFile(
    `${CONFIG_FOLDER}/${scraperId}.json`
  );
  if (encryptedCredentials) {
    const credentials = decryptCredentials(encryptedCredentials);
    const credentialsWithOtp = Object.assign(credentials, {
      otpCodeRetriever: async () => {
        const { otpCode } = await inquirer.prompt([
          {
            type: 'input',
            name: 'otpCode',
            message: 'Enter OTP code:',
          },
        ]);
        return otpCode;
      },
    });
    const options = {
      startDate: startDate.toDate(),
      combineInstallments,
      showBrowser,
    };

    try {
      const scrapedAccounts = await scrape(
        scraperId,
        credentialsWithOtp,
        options
      );
      await generateSeparatedReports(
        scrapedAccounts,
        saveLocation,
        includeFutureTransactions,
        includePendingTransactions
      );
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log('Could not find credentials file');
  }
}
