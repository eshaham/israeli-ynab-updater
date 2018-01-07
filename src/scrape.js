import moment from 'moment';
import inquirer from 'inquirer';
import json2csv from 'json2csv';

import { CONFIG_FOLDER, DOWNLOAD_FOLDER } from './definitions';
import { writeFile, readJsonFile } from './helpers/files';
import { decryptCredentials } from './helpers/credentials';
import { SCRAPERS, createScraper } from './helpers/scrapers';

async function getParameters() {
  const result = await inquirer.prompt([
    {
      type: 'list',
      name: 'scraperName',
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
  ]);
  return result;
}

async function exportAccountData(scraperName, account, combineInstallments) {
  console.log(`exporting ${account.txns.length} transactions for account # ${account.accountNumber}`);
  const txns = account.txns.map((txn) => {
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
  await writeFile(`${DOWNLOAD_FOLDER}/${scraperName} (${account.accountNumber}).csv`, csv);
}

export default async function () {
  const { scraperName, combineInstallments } = await getParameters();
  const encryptedCredentials = await readJsonFile(`${CONFIG_FOLDER}/${scraperName}.json`);
  if (encryptedCredentials) {
    const credentials = decryptCredentials(encryptedCredentials);
    const options = {
      companyId: scraperName,
      startDate: moment().startOf('month').subtract(4, 'month').toDate(),
      combineInstallments,
      verbose: false,
    };
    let result;
    try {
      const scraper = createScraper(options);
      scraper.onProgress((companyId, payload) => {
        console.log(`${companyId}: ${payload.type}`);
      });
      result = await scraper.scrape(credentials);
    } catch (e) {
      console.error(e);
      throw e;
    }
    console.log(`success: ${result.success}`);
    if (result.success) {
      const exports = result.accounts.map((account) => {
        return exportAccountData(scraperName, account, combineInstallments);
      });
      await Promise.all(exports);

      console.log(`${result.accounts.length} csv files saved under ${DOWNLOAD_FOLDER}`);
    } else {
      console.log(`error type: ${result.errorType}`);
      console.log('error:', result.errorMessage);
    }
  } else {
    console.log('Could not find credentials file');
  }
}
