import yargs from 'yargs';
import scrape from './scrape';
import saveCredentials from './save-credentials';

const args = yargs.options({
  mode: {
    alias: 'm',
    describe: 'mode for running',
  },
}).help().argv;

if (!args.mode || args.mode === 'scrape') {
  scrape();
} else if (args.mode === 'credentials') {
  saveCredentials();
}
