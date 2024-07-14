# Israeli YNAB Updater
A tool for updating YNAB using for the Israeli market. This tool uses [Israeli Banks Scrapers](https://github.com/eshaham/israeli-bank-scrapers) project as the source of fetching account data.

## Getting started

### Prerequisites 

In order to start using this tool, you will need to have Node.js (>= 10) installed on your machine.  
Go [here!](https://nodejs.org/en/download/) to download and install the latest Node.js for your operating system.

### Installation
Once Node.js is installed, run the following command to fetch the code:

```bash
git clone https://github.com/eshaham/israeli-ynab-updater
cd israeli-ynab-updater
```

If you're using `nvm` make sure to run `nvm use` inside project folder for best compatability.  
If you're using `nodenv`, it should automatically pick up the correct node version.

Next you will need to install dependencies by running
```bash
npm install
```

### Saving credentials
The credentials for each scraper are encrypted and saved in a dedicated file on your system.  
To save credentials for a specific scraper, run the following command and choose the scraper:

```bash
npm run setup
```

When asked 'What would you like to setup?' choose 'Scrapers'.

### Scraping
Once you save the credentials for relevant scrapers, run the following command to start scraping:

```bash
npm start
```

The CSV file should be created under `Transactions` folder in your Downloads folder, unless you choose a different folder.

You can also scrape in debug mode by running:

```bash
npm run start:debug
```
