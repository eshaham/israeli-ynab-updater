import oxr from 'oxr';
import moment from 'moment';
import all from 'promise-all-map';

import { readJsonFile, writeJsonFile } from '../helpers/files';

function asRateDate(date) {
  return moment(date).format('YYYY-MM-DD');
}

async function fetch(client, cache, dates) {
  const rates = await cache.read();

  await all(dates, async (rawDate) => {
    const date = asRateDate(rawDate);

    if (!rates[date]) {
      rates[date] = await client.historical(date);
    }

    return rates[date];
  });

  await cache.write(rates);

  return rates;
}

function cacheFactory(cachePath) {
  async function read() {
    const records = await readJsonFile(cachePath);
    return records || {};
  }

  async function write(records) {
    return writeJsonFile(cachePath, records);
  }

  return { read, write };
}

export function factory({ cachePath, appId }) {
  const storage = cacheFactory(cachePath);
  const client = oxr.factory({ appId });

  return {
    fetch: (...args) => fetch(client, storage, ...args),
  };
}

export function select(rates, rawDate) {
  const date = asRateDate(rawDate);
  return rates[date];
}
