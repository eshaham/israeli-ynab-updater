import fs from 'fs';
import os from 'os';
import jsonfile from 'jsonfile';

const folder = `${os.homedir()}/.ynab-updater`;

export function readFile(filename, options) {
  return new Promise((resolve, reject) => {
    jsonfile.readFile(`${folder}/${filename}`, options, (err, obj) => {
      if (err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
}

export function writeFile(filename, obj, options) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    jsonfile.writeFile(`${folder}/${filename}`, obj, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
