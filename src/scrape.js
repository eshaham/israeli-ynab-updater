import moment from 'moment';
import inquirer from 'inquirer';
import json2csv from 'json2csv';

import { CONFIG_FOLDER, DOWNLOAD_FOLDER } from './definitions';
import { writeFile, readJsonFile } from './helpers/files';
import { decryptCredentials } from './helpers/credentials';
import { SCRAPERS, createScraper } from './helpers/scrapers';

async function chooseScraper() {
  const scraperNameResult = await inquirer.prompt([{
    type: 'list',
    name: 'scraperName',
    message: 'Which bank would you like to scrape?',
    choices: Object.keys(SCRAPERS).map((id) => {
      return {
        name: SCRAPERS[id].name,
        value: id,
      };
    }),
  }]);
  return scraperNameResult.scraperName;
}

export default async function () {
  const scraperName = await chooseScraper();
  const encryptedCredentials = await readJsonFile(`${CONFIG_FOLDER}/${scraperName}.json`);
  if (encryptedCredentials) {
    const credentials = decryptCredentials(encryptedCredentials);
    const options = {
      companyId: scraperName,
      startDate: moment().startOf('month').subtract(4, 'month').toDate(),
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
      console.log(`account #: ${result.accountNumber}`);
      console.log(`number of txns: ${result.txns.length}`);
      const txns = result.txns.map((txn) => {
        return {
          Date: moment(txn.date).format('DD/MM/YYYY'),
          Payee: txn.description,
          Outflow: txn.type !== 'installments' ? txn.chargedAmount : txn.originalAmount,
          Installment: txn.installments ? txn.installments.number : null,
          Total: txn.installments ? txn.installments.total : null,
        };
      });
      const fields = ['Date', 'Payee', 'Outflow', 'Installment', 'Total'];
      const csv = json2csv({ data: txns, fields, withBOM: true });
      await writeFile(`${DOWNLOAD_FOLDER}/${scraperName}.csv`, csv);
      console.log('file saved');
    } else {
      console.log(`error type: ${result.errorType}`);
      console.log('error:', result.errorMessage);
    }
  } else {
    console.log('Could not find credentials file');
  }
}
