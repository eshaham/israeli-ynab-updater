import inquirer from 'inquirer';
import colors from 'colors/safe';
import tasksManager from '../../helpers/tasks-manager';

class DeleteTaskHandler {
  static async createAdapter() {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'taskName',
        message: 'Select a task to delete',
        choices: [...await tasksManager.getTasksList(), {
          name: 'Go Back',
          value: '',
        }],
      },
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: 'Are you sure?',
        default: false,
      },
    ]);

    if (answers.confirmDelete) {
      return new DeleteTaskHandler(answers.taskName);
    }
    console.log(colors.notify('Delete task cancelled'));

    return null;
  }

  constructor(taskName) {
    this._taskName = taskName;
  }

  async run() {
    if (!this._taskName) {
      throw new Error('Missing task name');
    }

    console.log(colors.notify(`Task '${this._taskName}' deleted`));
    await tasksManager.deleteTask(this._taskName);
  }
}

export default DeleteTaskHandler;
