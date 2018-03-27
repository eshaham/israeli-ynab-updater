import yargs from 'yargs';
import colors from 'colors/safe';
import setupMainMenu from './setup/setup-main-menu';
import scrapeMainMenu from './scrape/scrape-main-menu';

// set theme
colors.setTheme({
  title: 'bgCyan',
  notify: 'magenta',
});

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

if (!args.mode || args.mode === 'scrape') {
  scrapeMainMenu(args.show);
} else if (args.mode === 'setup') {
  setupMainMenu();
}
