import moment from 'moment';
import inquirer from 'inquirer';
import json2csv from 'json2csv';

import { CONFIG_FOLDER } from '../definitions';
import { writeFile, readJsonFile } from '../helpers/files';
import { decryptCredentials } from '../helpers/credentials';
import { SCRAPERS, createScraper } from '../helpers/scrapers';
import { readSettingsFile, writeSettingsFile } from '../helpers/settings';

async function getParameters(defaultSaveLocation) {
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
  ]);
  return result;
}

async function exportAccountData(scraperId, account, combineInstallments, saveLocation) {
  const txns = account.txns
    // Exclude transactions that may change in the future,
    // and keep transactions that don't have `status` prop.
    .filter(txn => (txn.status ? txn.status !== 'pending' : true))
    .map((txn) => {
      return {
        Date: moment(txn.date).format('DD/MM/YYYY'),
        Payee: txn.description,
        Inflow: txn.type !== 'installments' || !combineInstallments ? txn.chargedAmount : txn.originalAmount,
        Installment: txn.installments ? txn.installments.number : null,
        Total: txn.installments ? txn.installments.total : null,
      };
    });

  const fields = ['Date', 'Payee', 'Inflow', 'Installment', 'Total'];
  const csv = json2csv({ data: txns, fields, withBOM: true });
  await writeFile(`${saveLocation}/${SCRAPERS[scraperId].name} (${account.accountNumber}).csv`, csv);
}

export default async function (showBrowser) {
  const settings = await readSettingsFile();
  const {
    scraperId,
    combineInstallments,
    startDate,
    saveLocation,
  } = await getParameters(settings.saveLocation);

  if (saveLocation !== settings.saveLocation) {
    settings.saveLocation = saveLocation;
    await writeSettingsFile(settings);
  }

  const encryptedCredentials = await readJsonFile(`${CONFIG_FOLDER}/${scraperId}.json`);
  if (encryptedCredentials) {
    const credentials = decryptCredentials(encryptedCredentials);
    const options = {
      companyId: scraperId,
      startDate: startDate.toDate(),
      combineInstallments,
      showBrowser,
      verbose: false,
    };
    let result;
    try {
      const scraper = createScraper(options);
      scraper.onProgress((companyId, payload) => {
        const name = SCRAPERS[companyId] ? SCRAPERS[companyId].name : companyId;
        console.log(`${name}: ${payload.type}`);
      });
      result = await scraper.scrape(credentials);
    } catch (e) {
      console.error(e);
      throw e;
    }
    console.log(`success: ${result.success}`);
    if (result.success) {
      let numFiles = 0;
      for (let i = 0; i < result.accounts.length; i += 1) {
        const account = result.accounts[i];
        if (account.txns.length) {
          console.log(`exporting ${account.txns.length} transactions for account # ${account.accountNumber}`);
          await exportAccountData(scraperId, account, combineInstallments, saveLocation);
          numFiles += 1;
        } else {
          console.log(`no transactions for account # ${account.accountNumber}`);
        }
      }

      console.log(`${numFiles} csv files saved under ${saveLocation}`);
    } else {
      console.log(`error type: ${result.errorType}`);
      console.log('error:', result.errorMessage);
    }
  } else {
    console.log('Could not find credentials file');
  }
}
