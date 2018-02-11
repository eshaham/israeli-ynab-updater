import os from 'os';

export const CONFIG_FOLDER = `${os.homedir()}/.ynab-updater`;
export const SETTINGS_FILE = `${CONFIG_FOLDER}/settings.json`;
export const DOWNLOAD_FOLDER = `${os.homedir()}/Downloads/YNAB-Transactions`;
