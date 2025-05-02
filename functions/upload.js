const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");
const multiparty = require("multiparty");

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

    const form = new multiparty.Form();
    const data = await new Promise((resolve, reject) =>
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      })
    );

    const file = data.files.file[0];
    const contents = require("fs").readFileSync(file.path);
    const filename = data.fields.filename[0];
    const staff = data.fields.staff[0];
    const now = new Date().toISOString().replace(/:/g, "-");
    const path = `/QRデータ/${staff}_${now}_${filename}`;

    await dbx.filesUpload({
      path,
      contents,
      mode: "add",
      autorename: true,
      mute: false
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "success", path })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
