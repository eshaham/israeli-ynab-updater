import moment from 'moment';
import inquirer from 'inquirer';
import json2csv from 'json2csv';

import { CONFIG_FOLDER, DOWNLOAD_FOLDER, SCRAPERS } from './definitions';
import { writeFile, readJsonFile } from './helpers/files';
import { decryptCredentials } from './helpers/credentials';
import { discountScraper, leumiCardScraper, isracardScraper } from './helpers/scrapers';

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

function getScraperByName(scraperName) {
  switch (scraperName) {
    case 'discount':
      return discountScraper;
    case 'leumiCard':
      return leumiCardScraper;
    case 'isracard':
      return isracardScraper;
    default:
      throw new Error(`Unknown scraper ${scraperName}`);
  }
}

export default async function () {
  const scraperName = await chooseScraper();
  const encryptedCredentials = await readJsonFile(`${CONFIG_FOLDER}/${scraperName}.json`);
  if (encryptedCredentials) {
    const credentials = decryptCredentials(encryptedCredentials);
    const options = {
      startDate: moment().startOf('month').subtract(1, 'month').toDate(),
      verbose: false,
      eventsCallback: (msg) => {
        console.log(msg);
      },
    };
    const scraper = getScraperByName(scraperName);
    const result = await scraper(credentials, options);
    console.log(`success: ${result.success}`);
    if (result.success) {
      console.log(`account #: ${result.accountNumber}`);
      console.log(`number of txns: ${result.txns.length}`);
      const txns = result.txns.map((txn) => {
        return {
          Date: moment(txn.date).format('DD/MM/YYYY'),
          Payee: txn.description,
          Outflow: txn.amount,
        };
      });
      const fields = ['Date', 'Payee', 'Outflow'];
      const csv = json2csv({ data: txns, fields, withBOM: true });
      await writeFile(`${DOWNLOAD_FOLDER}/${scraperName}.csv`, csv);
      console.log('file saved');
    } else {
      console.log(`error type: ${result.errorType}`);
      console.log(`error message: ${result.errorMessage}`);
    }
  } else {
    console.log('Could not find credentials file');
  }
}
