import moment from 'moment';
import { SCRAPERS, createScraper } from '../helpers/scrapers';

async function prepareResults(scraperId, scraperName, scraperResult, combineInstallments) {
  return scraperResult.accounts.map((account) => {
    console.log(`${scraperName}: scraped ${account.txns.length} transactions from account ${account.accountNumber}`);

    const txns = account.txns.map((txn) => {
      return {
        Company: scraperName,
        Account: account.accountNumber,
        Date: moment(txn.date).format('DD/MM/YYYY'),
        Payee: txn.description,
        Inflow: txn.type !== 'installments' || !combineInstallments ? txn.chargedAmount : txn.originalAmount,
        Installment: txn.installments ? txn.installments.number : null,
        Total: txn.installments ? txn.installments.total : null,
      };
    });

    return {
      scraperId,
      scraperName,
      accountNumber: account.accountNumber,
      txns,
    };
  });
}

export default async function (scraperId, credentials, options) {
  const {
    combineInstallments,
    startDate,
    showBrowser,
  } = options;

  const scraperOptions = {
    companyId: scraperId,
    startDate,
    combineInstallments,
    showBrowser,
    verbose: false,
  };
  const scraperName = SCRAPERS[scraperId] ?
    SCRAPERS[scraperId].name : null;

  if (!scraperName) {
    throw new Error(`unknown scraper with id ${scraperId}`);
  }
  console.log(`scraping ${scraperName}`);

  let scraperResult;
  try {
    const scraper = createScraper(scraperOptions);
    scraper.onProgress((companyId, payload) => {
      console.log(`${scraperName}: ${payload.type}`);
    });
    scraperResult = await scraper.scrape(credentials);
  } catch (e) {
    console.error(e.message);
    throw e;
  }

  console.log(`success: ${scraperResult.success}`);
  if (!scraperResult.success) {
    console.log(`error type: ${scraperResult.errorType}`);
    console.log('error:', scraperResult.errorMessage);
    throw new Error(scraperResult.errorMessage);
  }

  return prepareResults(scraperId, scraperName, scraperResult, combineInstallments);
}
