const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

async function getAccessToken() {
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(
        process.env.DROPBOX_APP_KEY + ":" + process.env.DROPBOX_APP_SECRET
      ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN
    })
  });
  const json = await res.json();
  return json.access_token;
}

exports.handler = async (event) => {
  console.log("=== upload.js invoked ===");

  try {
    const body = JSON.parse(event.body || '{}');
    const { filename, staff, content } = body;

    if (!filename || !filename.endsWith('.csv')) {
      throw new Error("Invalid or missing .csv filename.");
    }
    if (!staff || typeof staff !== 'string') {
      throw new Error("Invalid or missing staff name.");
    }
    if (!/^[A-Za-z0-9+/=\s]+$/.test(content)) {
      throw new Error("Invalid base64 content.");
    }

    const token = await getAccessToken();
    const dbx = new Dropbox({ accessToken: token, fetch });

    const buffer = Buffer.from(content, "base64");
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `/QRデータ/${staff}_${now}_${filename}`;

    const uploadRes = await dbx.filesUpload({
      path: path,
      contents: buffer,
      mode: 'add',
      autorename: false
    });

    console.log(`Uploaded to: ${uploadRes.result.path_display}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', path: uploadRes.result.path_display })
    };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', error: err.message })
    };
  }
};
