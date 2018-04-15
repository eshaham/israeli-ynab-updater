import yargs from 'yargs';
import colors from 'colors/safe';
import setupMainMenu from './setup/setup-main-menu';
import scrapingMainMenu from './scrape/scraping-main-menu';

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
  scrapingMainMenu(args.show);
} else if (args.mode === 'setup') {
  setupMainMenu();
}
