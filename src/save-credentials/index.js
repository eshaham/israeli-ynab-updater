import inquirer from 'inquirer';
import { writeFile } from '../helpers/files';
import { enryptCredentials } from '../helpers/credentials';

function getCredentialsfields(scraperName) {
  const fieldMapping = {
    discount: ['id', 'password', 'num'],
    leumiCard: ['username', 'password'],
    isracard: ['id', 'card6Digits', 'password'],
  };
  return fieldMapping[scraperName];
}

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
    choices: [
      {
        name: 'Discount Bank',
        value: 'discount',
      },
      {
        name: 'Leumi Card',
        value: 'leumiCard',
      },
      {
        name: 'Isracard',
        value: 'isracard',
      },
    ],
  }]);
  const fields = getCredentialsfields(scraperNameResult.scraperName);
  const questions = fields.map((field) => {
    return {
      type: field === 'password' ? 'password' : 'input',
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
