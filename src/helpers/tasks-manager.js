import path from 'path';
import colors from 'colors/safe';
import moment from 'moment';
import { writeJsonFile, readJsonFile, getFolderFiles, deleteFile } from '../helpers/files';
import { TASKS_FOLDER } from '../definitions';
import { SCRAPERS } from '../helpers/scrapers';


class TaskManager {
  async getTasksList() {
    const files = await getFolderFiles(TASKS_FOLDER, '.json');
    const result = files.map(file => path.basename(file, '.json'));
    result.sort();
    return result;
  }

  async hasTask(taskName) {
    const tasksList = await this.getTasksList();
    return taskName && !!tasksList.find(taskListName =>
      taskListName.toLowerCase() === taskName.toLowerCase());
  }

  isValidTaskName(taskName) {
    return taskName && taskName.match(/^[a-zA-Z0-9_-]+$/);
  }

  async loadTask(taskName) {
    if (taskName && this.isValidTaskName(taskName)) {
      return readJsonFile(`${TASKS_FOLDER}/${taskName}.json`);
    }

    throw new Error(`failed to find a task named ${taskName}`);
  }

  async saveTask(taskName, taskData) {
    if (taskName && this.isValidTaskName(taskName)) {
      return writeJsonFile(`${TASKS_FOLDER}/${taskName}.json`, taskData);
    }

    throw new Error(`invalid task name provided ${taskName}`);
  }

  async deleteTask(taskName) {
    if (taskName && this.isValidTaskName(taskName)) {
      await deleteFile(`${TASKS_FOLDER}/${taskName}.json`);
    } else {
      throw new Error(`invalid task name provided ${taskName}`);
    }
  }

  _writeSummaryLine(key, value) {
    console.log(`- ${colors.bold(key)}: ${value}`);
  }

  async printTaskSummary(taskName) {
    const taskData = await this.loadTask(taskName);

    if (taskData) {
      const scrapers = taskData.scrapers || [];
      const {
        dateDiffByMonth,
        combineInstallments,
      } = taskData.options;
      const {
        combineReport,
        saveLocation,
      } = taskData.output;
      const substractValue = dateDiffByMonth - 1;
      const startDate = moment().subtract(substractValue, 'month').startOf('month');

      console.log(colors.underline.bold(`Task ${taskName} Summary`));
      this._writeSummaryLine('Scrapers', scrapers.map(scraper => SCRAPERS[scraper.id].name).join(', '));
      this._writeSummaryLine('Start scraping from', startDate.format('ll'));
      this._writeSummaryLine('Combine installments', combineInstallments ? 'yes' : 'no');
      this._writeSummaryLine('Save to location', saveLocation);
      this._writeSummaryLine('Create single report', combineReport ? 'yes' : 'no');
    }
  }
}

const taskManager = new TaskManager();

export default taskManager;