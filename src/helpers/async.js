
// eslint-disable-next-line
export async function tryCatch(promise) {
  let response;

  try {
    response = await promise;
  } catch (err) {
    return [err];
  }

  return [null, response];
}
