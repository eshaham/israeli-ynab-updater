import moment from 'moment';
import { readFile } from './helpers/files';
import { decryptCredentials } from './helpers/credentials';
import { leumiCardScraper } from './helpers/scrapers';

export default async function () {
  const encryptedCredentials = await readFile('leumiCard.json');
  const credentials = decryptCredentials(encryptedCredentials);
  const options = {
    startDate: moment().startOf('month').subtract(1, 'month').toDate(),
    verbose: false,
    eventsCallback: (msg) => {
      console.log(msg);
    },
  };
  const result = await leumiCardScraper(credentials, options);
  console.log(result);
}
