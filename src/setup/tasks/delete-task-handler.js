import inquirer from 'inquirer';
import colors from 'colors/safe';
import { TasksManager } from '../../helpers/tasks';

const tasksManager = new TasksManager();
const goBackOption = {
  name: 'Go Back',
  value: '',
};

const DeleteTaskHandler = (function createDeleteTaskHandler() {
  const _private = new WeakMap();

  class DeleteTaskHandler {
    static async createAdapter() {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'taskName',
          message: 'Select a task to delete',
          choices: [
            ...await tasksManager.getTasksList(),
            goBackOption,
          ],
        },
        {
          type: 'confirm',
          name: 'confirmDelete',
          message: 'Are you sure?',
          when: (answers) => !!answers.taskName,
          default: false,
        },
      ]);

      if (answers.taskName && answers.confirmDelete) {
        return new DeleteTaskHandler(answers.taskName);
      }
      console.log(colors.notify('Delete task cancelled'));

      return null;
    }

    constructor(taskName) {
      _private.set(this, { taskName });
    }

    async run() {
      if (!_private.get(this).taskName) {
        throw new Error('Missing task name');
      }

      console.log(colors.notify(`Task '${_private.get(this).taskName}' deleted`));
      await tasksManager.deleteTask(_private.get(this).taskName);
    }
  }

  return DeleteTaskHandler;
}());

export default DeleteTaskHandler;
