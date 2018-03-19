import moment from 'moment';
// import inquirer from 'inquirer';
import json2csv from 'json2csv';

import { CONFIG_FOLDER } from '../definitions';
import { writeFile, readJsonFile } from '../helpers/files';
import { decryptCredentials } from '../helpers/credentials';
// import { SCRAPERS } from '../helpers/scrapers';
import { readSettingsFile, writeSettingsFile } from '../helpers/settings';
import scrape from './scrape-base';

// async function getParameters(defaultSaveLocation) {
//   const startOfMonthMoment = moment().startOf('month');
//   const monthOptions = [];
//   for (let i = 0; i < 6; i += 1) {
//     const monthMoment = startOfMonthMoment.clone().subtract(i, 'month');
//     monthOptions.push({
//       name: monthMoment.format('ll'),
//       value: monthMoment,
//     });
//   }
//   const result = await inquirer.prompt([
//     {
//       type: 'list',
//       name: 'scraperId',
//       message: 'Which bank would you like to scrape?',
//       choices: Object.keys(SCRAPERS).map((id) => {
//         return {
//           name: SCRAPERS[id].name,
//           value: id,
//         };
//       }),
//     },
//     {
//       type: 'confirm',
//       name: 'combineInstallments',
//       message: 'Combine installment transactions?',
//       default: true,
//     },
//     {
//       type: 'list',
//       name: 'startDate',
//       message: 'What date would you like to start scraping from?',
//       choices: monthOptions,
//     },
//     {
//       type: 'input',
//       name: 'saveLocation',
//       message: 'Save folder?',
//       default: defaultSaveLocation,
//     },
//   ]);
//   return result;
// }

async function exportAccountData(account, saveLocation) {
  const fields = ['Date', 'Payee', 'Inflow', 'Installment', 'Total'];
  const csv = json2csv({ data: account.txns, fields, withBOM: true });
  await writeFile(`${saveLocation}/${account.scraperName} (${account.accountNumber}).csv`, csv);
}

export default async function (showBrowser) {
  const settings = await readSettingsFile();
  const {
    scraperId,
    combineInstallments,
    startDate,
    saveLocation,
  } = {
    scraperId: 'leumi',
    combineInstallments: true,
    startDate: moment('2018-02-01'),
    saveLocation: settings.saveLocation,
  }; // await getParameters(settings.saveLocation);

  if (saveLocation !== settings.saveLocation) {
    settings.saveLocation = saveLocation;
    await writeSettingsFile(settings);
  }

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

      let numFiles = 0;
      for (let i = 0; i < scrapedAccounts.length; i += 1) {
        const account = scrapedAccounts[i];
        if (account.txns.length) {
          console.log(`exporting ${account.txns.length} transactions for account # ${account.accountNumber}`);
          await exportAccountData(account, saveLocation);
          numFiles += 1;
        } else {
          console.log(`no transactions for account # ${account.accountNumber}`);
        }
      }

      console.log(`${numFiles} csv files saved under ${saveLocation}`);
    } catch (e) {
      console.log('error:', e.message);
    }
  } else {
    console.log('Could not find credentials file');
  }
}
