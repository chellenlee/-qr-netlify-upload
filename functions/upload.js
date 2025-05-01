const { Dropbox } = require('dropbox');
const multiparty = require('multiparty');
const fetch = require('node-fetch');  // fetch追加
const fs = require('fs');

exports.handler = async (event) => {
  console.log("Received event:", event.httpMethod, event.headers);

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
        console.log("Received file:", file.originalFilename);

        const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN, fetch });
        console.log("Using Dropbox token:", process.env.DROPBOX_TOKEN ? "SET" : "NOT SET");

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
