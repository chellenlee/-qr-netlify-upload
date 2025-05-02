const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

exports.handler = async function(event) {
  console.log("=== check.js invoked ===");

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let staffName;
  try {
    const body = JSON.parse(event.body);
    staffName = (body.staffName || "").trim();
    if (!staffName) {
      return { statusCode: 400, body: "Missing staffName" };
    }
    console.log("Received staffName:", staffName);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON in request body" };
  }

  const ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
  const dbx = new Dropbox({ accessToken: ACCESS_TOKEN, fetch });

  try {
    const listRes = await dbx.filesListFolder({ path: "" });
    const files = listRes.result.entries.filter(
      (f) => f.name.endsWith(".csv") && f.name.includes(staffName)
    );

    let rows = [];

    for (const file of files) {
      const downloadRes = await dbx.filesDownload({ path: file.path_lower });
      const content = downloadRes.result.fileBinary.toString("utf8");
      const lines = content.split(/\r?\n/).filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split(",").map(s => s.trim());
        if (parts.length === 7) {
          rows.push(parts);
        }
      }
    }

    // 重複排除（地点ID + ゼッケン番号）
    const seen = new Set();
    const deduped = [];

    for (const row of rows) {
      const key = row[0] + "_" + row[2]; // 地点 + ゼッケン
      const timestamp = row[4] + " " + row[5];
      row._timestamp = timestamp;

      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      } else {
        // すでに追加済み：比較して早いものだけ残す
        const existing = deduped.find(r => r[0] === row[0] && r[2] === row[2]);
        if (existing && row._timestamp < existing._timestamp) {
          Object.assign(existing, row);
        }
      }
    }

    // ソート（地点ID, 時刻）
    deduped.sort((a, b) => {
      if (a[0] !== b[0]) return a[0].localeCompare(b[0], "ja");
      return a._timestamp.localeCompare(b._timestamp);
    });

    // _timestamp 削除して返す
    for (const r of deduped) delete r._timestamp;

    return {
      statusCode: 200,
      body: JSON.stringify({ data: deduped }, null, 2)
    };

  } catch (err) {
    console.error("Dropbox API error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Dropbox API error", details: err.message })
    };
  }
};
