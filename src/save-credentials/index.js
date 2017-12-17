import inquirer from 'inquirer';
import { writeFile } from '../helpers/files';
import { enryptCredentials } from '../helpers/credentials';

const PASSWORD_FIELD = 'password';
const SCRAPERS = {
  discount: {
    name: 'Discount Bank',
    fields: ['id', PASSWORD_FIELD, 'num'],
  },
  leumiCard: {
    name: 'Leumi Card',
    fields: ['username', PASSWORD_FIELD],
  },
  isracard: {
    name: 'Isracard',
    fields: ['id', 'card6Digits', PASSWORD_FIELD],
  },
};

function validateNonEmpty(field, input) {
  if (input) {
    return true;
  }
  return `${field} must be non empty`;
}

export default async function () {
  const scraperNameResult = await inquirer.prompt([{
    type: 'list',
    name: 'scraperName',
    message: 'Which scraper would you like to save credentials for?',
    choices: Object.keys(SCRAPERS).map((id) => {
      return {
        name: SCRAPERS[id].name,
        value: id,
      };
    }),
  }]);
  const { fields } = SCRAPERS[scraperNameResult.scraperName];
  const questions = fields.map((field) => {
    return {
      type: field === PASSWORD_FIELD ? PASSWORD_FIELD : 'input',
      name: field,
      message: `Enter value for ${field}:`,
      validate: input => validateNonEmpty(field, input),
    };
  });
  const credentialsResult = await inquirer.prompt(questions);
  const encryptedCredentials = enryptCredentials(credentialsResult);
  await writeFile(`${scraperNameResult.scraperName}.json`, encryptedCredentials);
  console.log(`credentials file saved for ${scraperNameResult.scraperName}`);
}
