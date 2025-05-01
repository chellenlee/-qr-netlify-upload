const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const multiparty = require('multiparty');
const fs = require('fs');

exports.handler = async (event) => {
  console.log("HTTP Method:", event.httpMethod);

  if (event.httpMethod === 'GET') {
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN, fetch });
    try {
      const info = await dbx.usersGetCurrentAccount();
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "valid",
          account: info.result.name.display_name,
          email: info.result.email
        })
      };
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ status: "invalid", error: err.message })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const form = new multiparty.Form();
  return new Promise((resolve, reject) => {
    form.parse({ headers: event.headers, body: Buffer.from(event.body, 'base64') }, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return resolve({ statusCode: 500, body: JSON.stringify({ error: 'Form parsing failed' }) });
      }

      try {
        const file = files.file[0];
        const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN, fetch });

        const result = await dbx.filesUpload({
          path: `/QRデータ/${file.originalFilename}`,
          contents: fs.readFileSync(file.path),
          mode: 'add',
          autorename: true,
          mute: false
        });

        console.log("Upload successful:", result.path_display);
        resolve({ statusCode: 200, body: JSON.stringify({ success: true, path: result.path_display }) });
      } catch (error) {
        console.error("Dropbox upload error:", error);
        resolve({ statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) });
      }
    });
  });
};
