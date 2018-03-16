import { writeJsonFile } from '../helpers/files';
import { encryptCredentials } from '../helpers/credentials';
import { TASKS_FOLDER, DOWNLOAD_FOLDER } from '../definitions';
// TODO remove unused imports

export default async function () {
  const defaultSaveLocation = DOWNLOAD_FOLDER;

  // TODO remove hardcoded values
  const taskName = 'dynamic';
  const task = {
    scrapers: [
      { id: 'leumi', credentials: { username: '', password: '' } },
      { id: 'leumiCard', credentials: { username: '', password: '' } },
    ],
    configuration: {
      combineInstallments: false,
      dateDiffByMonth: 3,
      saveLocation: defaultSaveLocation,
    },
  };


  task.scrapers.forEach((taskScraper) => {
    const scraper = taskScraper;
    scraper.credentials = encryptCredentials(scraper.credentials);
  });

  await writeJsonFile(`${TASKS_FOLDER}/${taskName}.json`, task);
  console.log(`new task ${taskName} added`);
}
