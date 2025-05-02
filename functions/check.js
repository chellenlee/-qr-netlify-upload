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

exports.handler = async function (event) {
  try {
    const token = await getAccessToken();
    const dbx = new Dropbox({ accessToken: token, fetch });

    const { staffName } = JSON.parse(event.body || "{}");
    if (!staffName) {
      return { statusCode: 400, body: JSON.stringify({ error: "No staffName" }) };
    }

    const list = await dbx.filesListFolder({ path: "/QRデータ" });
    const matched = list.result.entries.filter(f => f.name.includes(staffName));

    const fileContents = await Promise.all(
      matched.map(async (file) => {
        const res = await dbx.filesDownload({ path: file.path_display });
        return res.result.fileBinary.toString("utf8");
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
