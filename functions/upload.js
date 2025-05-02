const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

async function getAccessToken() {
  console.log("Requesting Dropbox access token...");
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
  console.log("Access token response:", json);
  return json.access_token;
}

exports.handler = async function(event) {
  console.log("Upload function invoked");
  try {
    console.log("Raw event.body:", event.body);

    const token = await getAccessToken();
    const dbx = new Dropbox({ accessToken: token, fetch });

    const body = JSON.parse(event.body);
    const { filename, staff, content } = body;

    console.log("Parsed body fields:");
    console.log("filename:", filename);
    console.log("staff:", staff);
    console.log("content length:", content ? content.length : "undefined");

    if (!filename || !staff || !content) {
      throw new Error("Missing one or more required fields.");
    }

    const buffer = Buffer.from(content, "base64");
    const now = new Date().toISOString().replace(/:/g, "-");
    const path = `/QRデータ/${staff}_${now}_${filename}`;

    console.log("Uploading to Dropbox at path:", path);

    await dbx.filesUpload({
      path,
      contents: buffer,
      mode: "add",
      autorename: true,
      mute: false
    });

    console.log("Upload successful.");
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "success", path })
    };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
