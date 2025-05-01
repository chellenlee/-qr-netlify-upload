const { Dropbox } = require('dropbox');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const { staffName } = JSON.parse(event.body || '{}');
  if (!staffName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing staffName' })
    };
  }

  const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });

  try {
    const folderRes = await dbx.filesListFolder({ path: '/QRデータ' });
    const files = folderRes.result.entries.filter(file =>
      file.name.includes(staffName) && file.name.endsWith('.csv')
    );

    const fileContents = await Promise.all(
      files.map(async file => {
        const res = await dbx.filesDownload({ path: file.path_lower });
        return res.result.fileBinary.toString('utf8');
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ files: fileContents })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
