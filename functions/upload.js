const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

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

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) throw new Error("No boundary found in content-type");

    const boundary = boundaryMatch[1];
    const bodyBuffer = Buffer.from(event.body, 'base64');
    const parts = bodyBuffer.toString('utf8').split(`--${boundary}`);

    for (let part of parts) {
      if (part.includes('Content-Disposition') && part.includes('filename=')) {
        const [, headers, content] = part.split(/\r\n\r\n/);
        const nameMatch = headers.match(/name="(.+?)"/);
        const filenameMatch = headers.match(/filename="(.+?)"/);
        if (!filenameMatch) continue;

        const fileName = filenameMatch[1].trim();
        const fileContent = content.trimEnd();  // drop final 
-- if present

        const dbx = new Dropbox({ accessToken: process.env.DROPBOX_TOKEN, fetch });
        const result = await dbx.filesUpload({
          path: `/QRデータ/${fileName}`,
          contents: Buffer.from(fileContent, 'utf8'),
          mode: 'add',
          autorename: true,
          mute: false
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, path: result.path_display })
        };
      }
    }

    return { statusCode: 400, body: JSON.stringify({ error: "No file found in form data" }) };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
