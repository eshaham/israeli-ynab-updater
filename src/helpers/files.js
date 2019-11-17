import fs from 'fs';
import path from 'path';
import util from 'util';
import jsonfile from 'jsonfile';

const writeFileAsync = util.promisify(fs.writeFile);
const existsAsync = util.promisify(fs.exists);
const makeDirAsync = util.promisify(fs.mkdir);
const readdirAsync = util.promisify(fs.readdir);
const deleteFileAsync = util.promisify(fs.unlink);
const readJsonFileAsync = util.promisify(jsonfile.readFile);
const writeJsonFileAsync = util.promisify(jsonfile.writeFile);

async function verifyFolder(folderPath) {
  const pathTokens = folderPath.split(path.sep);
  let currentPath = '';
  for (let i = 0; i < pathTokens.length; i += 1) {
    const folder = pathTokens[i];
    currentPath += folder + path.sep;
    if (!await existsAsync(currentPath)) {
      await makeDirAsync(currentPath);
    }
  }
}

export async function getFolderFiles(folderPath, suffix) {
  await verifyFolder(folderPath);
  const files = await readdirAsync(folderPath);
  if (suffix) {
    return files.filter((filePath) => (path.extname(filePath) || '').toLowerCase() === suffix.toLowerCase());
  }
  return files;
}

export async function deleteFile(filePath) {
  return deleteFileAsync(filePath);
}

export async function writeFile(filePath, data, options) {
  const folderPath = path.dirname(filePath);
  await verifyFolder(folderPath);
  return writeFileAsync(filePath, data, options);
}

export async function readJsonFile(filePath, options) {
  const exists = await existsAsync(filePath);
  if (!exists) {
    return null;
  }
  return readJsonFileAsync(filePath, options);
}

export async function writeJsonFile(filePath, obj, options) {
  const folderPath = path.dirname(filePath);
  await verifyFolder(folderPath);
  await writeJsonFileAsync(filePath, obj, options);
}
