import inquirer from 'inquirer';
import ModifyTaskHandler from './modify-task-handler';
import CreateTaskHandler from './create-task-handler';
import DeleteTaskHandler from './delete-task-handler';

async function selectAction() {
  const CREATE_NEW_TASK_ACTION = 'new';
  const MODIFY_TASK_ACTION = 'modify';
  const DELETE_TASK_ACTION = 'delete';
  const QUIT_ACTION = 'quit';

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        {
          name: 'Create a new task',
          value: CREATE_NEW_TASK_ACTION,
        },
        {
          name: 'Modify an existing task',
          value: MODIFY_TASK_ACTION,
        },
        new inquirer.Separator(),
        {
          name: 'Delete a task',
          value: DELETE_TASK_ACTION,
        },
        {
          name: 'Quit',
          value: QUIT_ACTION,
        },
      ],
    },
  ]);

  switch (answers.action) {
    case CREATE_NEW_TASK_ACTION:
      {
        const createNewTaskAdapter = new CreateTaskHandler();
        await createNewTaskAdapter.run();
        await selectAction();
      }
      break;
    case MODIFY_TASK_ACTION:
      {
        const adapter = await ModifyTaskHandler.createAdapter();

        if (adapter) {
          await adapter.run();
        }

        await selectAction();
      }
      break;
    case DELETE_TASK_ACTION:
      {
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
