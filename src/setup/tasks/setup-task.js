import inquirer from 'inquirer';
import ModifyTaskHandler from './modify-task-handler';
import CreateTaskHandler from './create-task-handler';
import DeleteTaskHandler from './delete-task-handler';


async function selectAction() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        {
          name: 'Create a new task',
          value: 'new',
        },
        {
          name: 'Modify an existing task',
          value: 'modify',
        },
        new inquirer.Separator(),
        {
          name: 'Delete a task',
          value: 'delete',
        },
        {
          name: 'Quit',
          value: 'quit',
        },
      ],
    },
  ]);

  switch (answers.action) {
    case 'new': {
      const createNewTaskAdapter = new CreateTaskHandler();
      await createNewTaskAdapter.run();
      await selectAction();
    }
      break;
    case 'modify': {
      const adapter = await ModifyTaskHandler.createAdapter();

      if (adapter) {
        await adapter.run();
      }

      await selectAction();
    }
      break;
    case 'delete': {
      const adapter = await DeleteTaskHandler.createAdapter();

      if (adapter) {
        await adapter.run();
      }

      await selectAction();
    }
      break;
    default:
      break;
  }
}

export default selectAction;
