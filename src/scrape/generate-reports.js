import json2csv from 'json2csv';
import colors from 'colors/safe';
import moment from 'moment';
import { DATE_TIME_FORMAT } from '../constants';
import { writeFile } from '../helpers/files';

function getReportFields(isSingleReport) {
  const result = [
    {
      label: 'Date',
      value: row => row.dateMoment.format('DD/MM/YYYY'),
    },
    {
      label: 'Payee',
      value: 'payee',
    },
    {
      label: 'Inflow',
      value: 'amount',
    },
    {
      label: 'Status',
      value: 'status',
    },
    {
      label: 'Installment',
      value: 'installment',
    },
    {
      label: 'Total',
      value: 'total',
    },
  ];

  if (isSingleReport) {
    result.unshift(
      {
        label: 'Company',
        value: 'company',
      },
      {
        label: 'Account',
        value: 'account',
      },
    );
  }

  return result;
}

function filterTransactions(transactions, includeFutureTransactions, includePendingTransactions) {
  let result = transactions;

  if (result && result.length) {
    if (!includeFutureTransactions) {
      const nowMoment = moment();
      result = result.filter((txn) => {
        const txnMoment = moment(txn.dateMoment);
        return txnMoment.isSameOrBefore(nowMoment, 'day');
      });
    }

    if (!includePendingTransactions) {
      result = result.filter(txn => (txn.status || '').toLowerCase() !== 'pending');
    }
  }

  return result;
}

async function exportAccountData(txns, scraperName, accountNumber, saveLocation) {
  const fields = getReportFields(false);
  const csv = json2csv({ data: txns, fields, withBOM: true });
  await writeFile(`${saveLocation}/${scraperName} (${accountNumber}).csv`, csv);
}

export async function generateSeparatedReports(
  scrapedAccounts,
  saveLocation,
  includeFutureTransactions,
  includePendingTransactions,
) {
  let numFiles = 0;
  for (let i = 0; i < scrapedAccounts.length; i += 1) {
    const {
      txns: accountTxns,
      accountNumber,
      scraperName,
    } = scrapedAccounts[i];

    const filteredTxns = filterTransactions(
      accountTxns,
      includeFutureTransactions,
      includePendingTransactions,
    );
    if (filteredTxns.length) {
      console.log(colors.notify(`exporting ${accountTxns.length} transactions for account # ${accountNumber}`));
      await exportAccountData(filteredTxns, scraperName, accountNumber, saveLocation);
      numFiles += 1;
    } else {
      console.log(`no transactions for account # ${accountNumber}`);
    }
  }

  console.log(colors.notify(`${numFiles} csv files saved under ${saveLocation}`));
}

export async function generateSingleReport(
  scrapedAccounts,
  saveLocation,
  includeFutureTransactions,
  includePendingTransactions,
) {
  const fileTransactions = scrapedAccounts.reduce((acc, account) => {
    const filteredTransactions = filterTransactions(
      account.txns,
      includeFutureTransactions,
      includePendingTransactions,
    );
    acc.push(...filteredTransactions);
    return acc;
  }, []);
  const filePath = `${saveLocation}/${moment().format(DATE_TIME_FORMAT)}.csv`;
  const fileFields = getReportFields(true);
  const fileContent = json2csv({ data: fileTransactions, fields: fileFields, withBOM: true });
  await writeFile(filePath, fileContent);
  console.log(colors.notify(`created file ${filePath}`));
}
