import yargs from 'yargs';
import scrape from './scrape/scrape-individual';
import setupMainMenu from './setup/setup-main-menu';

const args = yargs.options({
  mode: {
    alias: 'm',
    describe: 'mode for running',
  },
  show: {
    alias: 's',
    describe: 'show browser while scraping',
    type: 'boolean',
    default: false,
  },
}).help().argv;

if (!args.mode || args.mode === 'scraping') {
  scrape(args.show);
} else if (args.mode === 'setup') {
  setupMainMenu();
}
