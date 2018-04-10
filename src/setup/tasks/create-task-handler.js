import inquirer from 'inquirer';
import colors from 'colors/safe';
import { DOWNLOAD_FOLDER } from '../../definitions';
import ModifyTaskHandler from './modify-task-handler';
import { TasksManager } from '../../helpers/tasks';

const tasksManager = new TasksManager();

function createEmptyTaskData() {
  return {
    scrapers: [],
    options: {
      combineInstallments: false,
      dateDiffByMonth: 3,
    },
    output: {
      saveLocation: DOWNLOAD_FOLDER,
      combineReport: true,
      includeFutureTransactions: false,
    },
  };
}

export default class {
  async run() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is the task name (leave blank to cancel)',
        validate: async (value) => {
          if (value) {
            const alreadyExists = await tasksManager.hasTask(value);

            if (alreadyExists) {
              return 'A task with this name already exists, please type a unique name';
            }

            const invalidPattern = !tasksManager.isValidTaskName(value);

            if (invalidPattern) {
              return 'The task name must include only these characters: A-Z, 0-9, -, _';
            }
          }

          return true;
        },
      },
    ]);

    const taskName = answers.name;

    if (taskName) {
      const taskData = createEmptyTaskData();
      await tasksManager.saveTask(taskName, taskData);
      const modifyTaskAdapter = new ModifyTaskHandler(taskName);
      console.log(colors.notify(`Task '${taskName}' created`));
      await modifyTaskAdapter.run();
    } else {
      console.log(colors.notify('Task creation cancelled'));
    }
  }
}
