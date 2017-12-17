import os from 'os';

export const CONFIG_FOLDER = `${os.homedir()}/.ynab-updater`;
export const DOWNLOAD_FOLDER = `${os.homedir()}/Downloads/YNAB-Transactions`;

export const PASSWORD_FIELD = 'password';

export const SCRAPERS = {
  discount: {
    name: 'Discount Bank',
    fields: ['id', PASSWORD_FIELD, 'num'],
  },
  leumiCard: {
    name: 'Leumi Card',
    fields: ['username', PASSWORD_FIELD],
  },
  isracard: {
    name: 'Isracard',
    fields: ['id', 'card6Digits', PASSWORD_FIELD],
  },
};
