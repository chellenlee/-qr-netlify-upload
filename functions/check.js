const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('=== check.js invoked ===');

  const staffName = event.queryStringParameters?.staffName || '';
  console.log('Received staffName:', staffName);

  const DROPBOX_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;

  if (!DROPBOX_TOKEN) {
    console.error('Missing DROPBOX_ACCESS_TOKEN');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Dropbox token' }),
    };
  }

  const dbx = new Dropbox({ accessToken: DROPBOX_TOKEN, fetch });

  try {
    const list = await dbx.filesListFolder({ path: '' });
    const files = list.result.entries
      .filter(f => f.name.endsWith('.csv') && f.name.startsWith(staffName))
      .map(f => f.name);

    return {
      statusCode: 200,
      body: JSON.stringify({ files }),
    };
  } catch (error) {
    console.error('Error listing Dropbox folder:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to list Dropbox folder' }),
    };
  }
};
