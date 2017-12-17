import fs from 'fs';
import os from 'os';
import util from 'util';
import jsonfile from 'jsonfile';

const folderExistsAsync = util.promisify(fs.exists);
const makeDirAsync = util.promisify(fs.mkdir);
const readFileAsync = util.promisify(jsonfile.readFile);
const writeFileAsync = util.promisify(jsonfile.writeFile);

const folder = `${os.homedir()}/.ynab-updater`;

export function readFile(filename, options) {
  return readFileAsync(`${folder}/${filename}`, options);
}

export async function writeFile(filename, obj, options) {
  const exists = await folderExistsAsync(folder);
  if (!exists) {
    await makeDirAsync(folder);
  }
  await writeFileAsync(`${folder}/${filename}`, obj, options);
}
