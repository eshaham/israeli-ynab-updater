import inquirer from 'inquirer';
import colors from 'colors/safe';
import { PASSWORD_FIELD } from '../../constants';
import { SCRAPERS } from '../../helpers/scrapers';
import { encryptCredentials } from '../../helpers/credentials';
import tasksManager from '../../helpers/tasks-manager';

const goBackOption = {
  name: 'Go Back',
  value: '',
};

function getListOfScrapers(existingTaskScrapers) {
  return Object.keys(SCRAPERS).map((scraperId) => {
    const result = { value: scraperId, name: SCRAPERS[scraperId].name };
    const hasCredentials = existingTaskScrapers
      .find(scraper => scraper.id === scraperId);
    result.name = `${hasCredentials ? 'Edit' : 'Add'} ${result.name}`;

    return result;
  });
}

function validateNonEmpty(field, input) {
  if (input) {
    return true;
  }
  return `${field} must be non empty`;
}

const ModifyTaskHandler = (function createModifyTaskHandler() {
  const _private = new WeakMap();

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
      _private.set(this, { taskName });
    }

    /*
   * @private
   */
    async manageOptions() {
      const {
        combineInstallments,
        dateDiffByMonth,
      } = _private.get(this).taskData.options;

      const {
        saveLocation,
        combineReport,
        excludeFutureTransactions,
      } = _private.get(this).taskData.output;

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
          default: !!combineReport,
        },
        {
          type: 'confirm',
          name: 'excludeFutureTransactions',
          message: 'exclude future transactions?',
          default: !!excludeFutureTransactions,
        },
      ]);

      _private.get(this).taskData.options.combineInstallments = answers.combineInstallments;
      _private.get(this).taskData.options.dateDiffByMonth = answers.dateDiffByMonth;
      _private.get(this).taskData.output.saveLocation = answers.saveLocation;
      _private.get(this).taskData.output.combineReport = answers.combineReport;
      _private.get(this).taskData.output.excludeFutureTransactions =
        answers.excludeFutureTransactions;
      console.log(colors.notify('Changes saved'));
      await this.saveTask();
    }

    /*
   * @private
   */
    async manageScrapers() {
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
              const hasScrapers = _private.get(this).taskData.scrapers.length !== 0;

              if (!hasScrapers) {
                console.log(colors.notify('task has no scrapers defined'));
              }

              return hasScrapers;
            }

            return answers.action === 'modify';
          },
          choices: (answers) => {
            if (answers.action === 'modify') {
              return [...getListOfScrapers(_private.get(this).taskData.scrapers), goBackOption];
            }

            const taskScrapers = _private.get(this).taskData.scrapers.map(scraper => (
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
            _private.get(this).taskData.scrapers = _private.get(this)
              .taskData.scrapers.filter(item => item.id !== scraperId);
            await this.saveTask();
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

          const scraperData = _private.get(this).taskData.scrapers
            .find(scraper => scraper.id === scraperId);
          if (!scraperData) {
            _private.get(this).taskData.scrapers
              .push({ id: scraperId, credentials: encryptedCredentials });
            console.log(colors.notify(`'${scraperId}' scrapper added`));
          } else {
            scraperData.credentials = encryptedCredentials;
            console.log(colors.notify(`'${scraperId}' scrapper updated`));
          }
          await this.saveTask();
        }
      }
    }

    /*
   * @private
   */
    async saveTask() {
      await tasksManager.saveTask(_private.get(this).taskName, _private.get(this).taskData);
    }

    async run() {
      let firstTimeEntering = false;

      if (!_private.get(this).taskName) {
        throw new Error('missing task name');
      }

      if (!_private.get(this).taskData) {
        firstTimeEntering = true;
        _private.get(this).taskData = await tasksManager.loadTask(_private.get(this).taskName);
      }

      if (_private.get(this).taskData) {
        if (firstTimeEntering) {
          console.log(colors.title(`Entering task '${_private.get(this).taskName}' edit mode`));
        }

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What do you want to do?',
            choices: [
              {
                name: 'View task summary',
                value: 'summary',
              },
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
          case 'summary':
            console.log(''); // print empty line
            await tasksManager.printTaskSummary(_private.get(this).taskName);
            console.log(''); // print empty line
            await this.run();
            break;
          case 'scrapers':
            await this.manageScrapers();
            await this.run();
            break;
          case 'options':
            await this.manageOptions();
            await this.run();
            break;
          default:
            console.log(colors.title(`Leaving task '${_private.get(this).taskName}' edit mode`));
            break;
        }
      }
    }
  }

  return ModifyTaskHandler;
}());

export default ModifyTaskHandler;
