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

async function exportAccountData(account, saveLocation) {
  const fields = getReportFields(false);
  const csv = json2csv({ data: account.txns, fields, withBOM: true });
  await writeFile(`${saveLocation}/${account.scraperName} (${account.accountNumber}).csv`, csv);
}

export async function generateSeparatedReports(scrapedAccounts, saveLocation) {
  let numFiles = 0;
  for (let i = 0; i < scrapedAccounts.length; i += 1) {
    const account = scrapedAccounts[i];
    if (account.txns.length) {
      console.log(colors.notify(`exporting ${account.txns.length} transactions for account # ${account.accountNumber}`));
      await exportAccountData(account, saveLocation);
      numFiles += 1;
    } else {
      console.log(`no transactions for account # ${account.accountNumber}`);
    }
  }

  console.log(colors.notify(`${numFiles} csv files saved under ${saveLocation}`));
}

export async function generateSingleReport(scrapedAccounts, saveLocation) {
  const fileTransactions = scrapedAccounts.reduce((acc, account) => {
    acc.push(...account.txns);
    return acc;
  }, []);
  const filePath = `${saveLocation}/${moment().format(DATE_TIME_FORMAT)}.csv`;
  const fileFields = getReportFields(true);
  const fileContent = json2csv({ data: fileTransactions, fields: fileFields, withBOM: true });
  await writeFile(filePath, fileContent);
  console.log(colors.notify(`created file ${filePath}`));
}
