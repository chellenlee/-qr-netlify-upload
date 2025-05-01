const { Dropbox } = require('dropbox');
const multiparty = require('multiparty');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const form = new multiparty.Form();
  return new Promise((resolve, reject) => {
    form.parse({ headers: event.headers, body: Buffer.from(event.body, 'base64') }, async (err, fields, files) => {
      if (err) {
        return resolve({ statusCode: 500, body: JSON.stringify({ error: 'Form parsing failed' }) });
      }

      const file = files.file[0];
      const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN });

      try {
        const result = await dbx.filesUpload({
          path: `/QRデータ/${file.originalFilename}`,
          contents: require('fs').readFileSync(file.path),
          mode: 'add',
          autorename: true,
          mute: false
        });
        resolve({ statusCode: 200, body: JSON.stringify({ success: true, path: result.path_display }) });
      } catch (error) {
        resolve({ statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) });
      }
    });
  });
};
