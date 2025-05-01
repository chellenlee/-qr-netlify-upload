const fetch = require('node-fetch');

exports.handler = async (event) => {
  const token = process.env.DROPBOX_TOKEN;
  const { staffName } = JSON.parse(event.body);

  if (!staffName) {
    return { statusCode: 400, body: "Missing staffName" };
  }

  try {
    const listRes = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ path: "/QRデータ" })
    });

    const listData = await listRes.json();
    const csvFiles = listData.entries.filter(
      file => file.name.includes(staffName) && file.name.endswith(".csv")
    );

    const csvContents = await Promise.all(csvFiles.map(file => 
      fetch("https://content.dropboxapi.com/2/files/download", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Dropbox-API-Arg": JSON.stringify({ path: file.path_lower })
        }
      }).then(res => res.text())
    ));

    return {
      statusCode: 200,
      body: JSON.stringify({ data: csvContents })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Error retrieving data: ${err.message}`
    };
  }
};
