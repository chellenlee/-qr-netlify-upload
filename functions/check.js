const { Dropbox } = require("dropbox");

exports.handler = async function(event, context) {
  console.log("=== check.js invoked ===");

  const staffName = event.queryStringParameters?.staff;
  if (!staffName) {
    console.log("No staffName in query");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No staffName" })
    };
  }

  console.log("Received staffName:", staffName);

  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    console.log("Missing Dropbox token");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Dropbox token" })
    };
  }

  const dbx = new Dropbox({ accessToken });

  try {
    const response = await dbx.filesListFolder({ path: "/QRデータ" });
    console.log("Dropbox API responded with", response.result.entries.length, "entries");

    const matched = response.result.entries.filter(
      file => file.name.startsWith(staffName + "_") && file.name.endsWith(".csv")
    );

    console.log("Matched", matched.length, "files");

    return {
      statusCode: 200,
      body: JSON.stringify({ entries: matched })
    };
  } catch (err) {
    console.error("Dropbox API error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Dropbox API error", details: err.message })
    };
  }
};
