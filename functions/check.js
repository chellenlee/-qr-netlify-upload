const fetch = require("node-fetch");
const { Dropbox } = require("dropbox");

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
  console.log("=== check.js invoked ===");

  try {
    const body = JSON.parse(event.body || '{}');
    const staffName = body.staffName;

    if (!staffName || typeof staffName !== 'string') {
      throw new Error("Invalid or missing staffName.");
    }
    console.log("Received staffName:", staffName);

    const token = await getAccessToken();
    const dbx = new Dropbox({ accessToken: token, fetch });

    const folderRes = await dbx.filesListFolder({ path: '/QRデータ' });
    const files = folderRes.result.entries.filter(file =>
      file.name.includes(staffName) && file.name.endsWith('.csv')
    );

    if (files.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ files: [], message: "一致するCSVファイルが見つかりませんでした。" })
      };
    }

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
    console.error("check.js error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
