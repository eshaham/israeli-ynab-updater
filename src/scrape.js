import moment from 'moment';
import inquirer from 'inquirer';

import { SCRAPERS } from './definitions';
import { readFile } from './helpers/files';
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
  const encryptedCredentials = await readFile(`${scraperName}.json`);
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
    console.log(result);
  } else {
    console.log('Could not find credentials file');
  }
}
