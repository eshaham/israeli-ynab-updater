import inquirer from 'inquirer';
import colors from 'colors/safe';
import PASSWORD_FIELD from '../../constants';
import { SCRAPERS } from '../../helpers/scrapers';
import { encryptCredentials } from '../../helpers/credentials';
import tasksManager from '../../helpers/tasks-manager';

const goBackOption = {
  name: 'Go Back',
  value: '',
};

function validateNonEmpty(field, input) {
  if (input) {
    return true;
  }
  return `${field} must be non empty`;
}

class ModifyTaskHandler {
  static async createAdapter() {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'taskName',
        message: 'Select a task to modify',
        choices: [...await tasksManager.getTasksList(), goBackOption],
      },
    ]);

    if (answers.taskName) {
      return new ModifyTaskHandler(answers.taskName);
    }

    return null;
  }

  constructor(taskName) {
    this._taskName = taskName;
  }

  _getListOfScrapers() {
    return Object.keys(SCRAPERS).map((scraperId) => {
      const result = { value: scraperId, name: SCRAPERS[scraperId].name };
      const hasCredentials = this._taskData.scrapers
        .findIndex(scraper => scraper.id === scraperId) !== -1;
      result.name = `${hasCredentials ? 'Edit' : 'Add'} ${result.name}`;

      return result;
    });
  }

  async _manageOptions() {
    const {
      combineInstallments,
      dateDiffByMonth,
    } = this._taskData.options;

    const {
      saveLocation,
      combineReport,
    } = this._taskData.output;

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'combineInstallments',
        message: 'Combine installment transactions?',
        default: combineInstallments,
      },
      {
        type: 'input',
        name: 'dateDiffByMonth',
        message: 'How many months do you want to scrape (1-12)?',
        default: dateDiffByMonth,
        filter: (value) => {
          if (Number.isFinite(value) && !Number.isNaN(value)) {
            return value;
          } else if (typeof value === 'string' && value.match(/^[0-9]+$/)) {
            return value * 1;
          }

          return null;
        },
        validate: (value) => {
          const pass = value !== null && value >= 1 && value <= 12;

          if (pass) {
            return true;
          }

          return 'Please enter a value between 1 and 12';
        },
      },
      {
        type: 'input',
        name: 'saveLocation',
        message: 'Save folder?',
        default: saveLocation,
      },
      {
        type: 'confirm',
        name: 'combineReport',
        message: 'Combine all accounts into a single report?',
        default: combineReport,
      },
    ]);

    this._taskData.options.combineInstallments = answers.combineInstallments;
    this._taskData.options.dateDiffByMonth = answers.dateDiffByMonth;
    this._taskData.output.saveLocation = answers.saveLocation;
    this._taskData.output.combineReport = answers.combineReport;
    console.log(colors.notify('Changes saved'));
    await this._saveTask();
  }

  async _manageScrapers() {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        choices: [
          {
            name: 'Add / Edit a scraper',
            value: 'modify',
          },
          {
            name: 'Delete a scraper',
            value: 'delete',
          },
          goBackOption,
        ],
      },
      {
        type: 'list',
        name: 'scraperId',
        message: 'Select a scraper',
        when: (answers) => {
          if (answers.action === 'delete') {
            const hasScrapers = this._taskData.scrapers.length !== 0;

            if (!hasScrapers) {
              console.log(colors.notify('task has no scrapers defined'));
            }

            return hasScrapers;
          }

          return answers.action === 'modify';
        },
        choices: (answers) => {
          if (answers.action === 'modify') {
            return [...this._getListOfScrapers(), goBackOption];
          }

          const taskScrapers = this._taskData.scrapers.map(scraper => (
            {
              value: scraper.id,
              name: SCRAPERS[scraper.id].name,
            }));

          return [...taskScrapers, goBackOption];
        },
      },
      {
        type: 'confirm',
        name: 'confirmDelete',
        when: answers => answers.action === 'delete' && answers.scraperId,
        message: 'Are you sure?',
        default: false,
      },
    ]);

    const { scraperId, action, confirmDelete } = answers;

    if (scraperId) {
      if (action === 'delete') {
        if (confirmDelete) {
          console.log(colors.notify(`Scraper ${scraperId} deleted`));
          this._taskData.scrapers = this._taskData.scrapers.filter(item => item.id !== scraperId);
          await this._saveTask();
        } else {
          console.log(colors.notify('Delete scraper cancelled'));
        }
      } else if (action === 'modify') {
        const { loginFields } = SCRAPERS[scraperId];
        const questions = loginFields.map((field) => {
          return {
            type: field === PASSWORD_FIELD ? PASSWORD_FIELD : 'input',
            name: field,
            message: `Enter value for ${field}:`,
            validate: input => validateNonEmpty(field, input),
          };
        });
        const credentialsResult = await inquirer.prompt(questions);
        const encryptedCredentials = encryptCredentials(credentialsResult);

        const scraperData = this._taskData.scrapers.find(scraper => scraper.id === scraperId);
        if (!scraperData) {
          this._taskData.scrapers.push({ id: scraperId, credentials: encryptedCredentials });
          console.log(colors.notify(`'${scraperId}' scrapper added`));
        } else {
          scraperData.credentials = encryptedCredentials;
          console.log(colors.notify(`'${scraperId}' scrapper updated`));
        }
        await this._saveTask();
      }
    }
  }

  async _saveTask() {
    await tasksManager.saveTask(this._taskName, this._taskData);
  }

  async run() {
    let firstTimeEntering = false;

    if (!this._taskName) {
      throw new Error('missing task name');
    }

    if (!this._taskData) {
      firstTimeEntering = true;
      this._taskData = await tasksManager.loadTask(this._taskName);
    }

    if (this._taskData) {
      if (firstTimeEntering) {
        console.log(colors.title(`Entering task '${this._taskName}' edit mode`));
      }

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What do you want to update?',
          choices: [
            {
              name: 'Update scrapers list',
              value: 'scrapers',
            },
            {
              name: 'Update scraping options',
              value: 'options',
            },
            goBackOption,
          ],
        },
      ]);

      switch (answers.action) {
        case 'scrapers':
          await this._manageScrapers();
          await this.run();
          break;
        case 'options':
          await this._manageOptions();
          await this.run();
          break;
        default:
          console.log(colors.title(`Leaving task '${this._taskName}' edit mode`));
          break;
      }
    }
  }
}

export default ModifyTaskHandler;
