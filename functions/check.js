const DROPBOX_TOKEN = process.env.DROPBOX_TOKEN;
const { Dropbox } = require('dropbox');

exports.handler = async (event) => {
  console.log("=== check.js invoked ===");
  let staffName;

  try {
    const body = JSON.parse(event.body || '{}');
    staffName = body.staffName;
    console.log("Received staffName:", staffName);
  } catch (e) {
    console.error("Failed to parse body:", e);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  if (!DROPBOX_TOKEN) {
    console.log("Missing Dropbox token");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Dropbox token" }),
    };
  }

  if (!staffName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No staffName" }),
    };
  }

  const dbx = new Dropbox({ accessToken: DROPBOX_TOKEN, fetch });

  try {
    const response = await dbx.filesListFolder({ path: "" });
    const files = response.result.entries
      .filter(entry => entry.name.includes(staffName))
      .map(entry => entry.name);

    return {
      statusCode: 200,
      body: JSON.stringify(files),
    };
  } catch (err) {
    console.error("Dropbox API error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Dropbox API error", details: err.message }),
    };
  }
};
