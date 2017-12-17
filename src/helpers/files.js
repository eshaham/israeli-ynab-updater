import fs from 'fs';
import os from 'os';
import util from 'util';
import jsonfile from 'jsonfile';

const existsAsync = util.promisify(fs.exists);
const makeDirAsync = util.promisify(fs.mkdir);
const readFileAsync = util.promisify(jsonfile.readFile);
const writeFileAsync = util.promisify(jsonfile.writeFile);

const folder = `${os.homedir()}/.ynab-updater`;

export async function readFile(filename, options) {
  const exists = await existsAsync(`${folder}/${filename}`);
  if (!exists) {
    return null;
  }
  return readFileAsync(`${folder}/${filename}`, options);
}

export async function writeFile(filename, obj, options) {
  const exists = await existsAsync(folder);
  if (!exists) {
    await makeDirAsync(folder);
  }
  await writeFileAsync(`${folder}/${filename}`, obj, options);
}
