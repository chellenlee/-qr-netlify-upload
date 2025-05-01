const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { filename, content } = JSON.parse(event.body);
  const token = process.env.DROPBOX_TOKEN;

  const csvWithBOM = '\uFEFF' + content;
  const buffer = Buffer.from(csvWithBOM, 'utf8');

  try {
    const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: `/QRデータ/${filename}`,
          mode: "add",
          autorename: true,
          mute: false
        })
      },
      body: buffer
    });

    if (!response.ok) throw new Error(await response.text());
    return { statusCode: 200, body: "Upload successful" };
  } catch (err) {
    return { statusCode: 500, body: `Upload failed: ${err.message}` };
  }
};
