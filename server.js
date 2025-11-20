const express = require("express");
const request = require("request");
const app = express();

app.get("/proxy", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("No url provided");

  request({ url, encoding: null }, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(500).send("Failed to fetch content");
    }

    const contentType = response.headers["content-type"] || "";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", contentType);

    // Если это плейлист .m3u8 — переписываем сегменты
    if (contentType.includes("application/vnd.apple.mpegurl") || url.endsWith(".m3u8")) {
      const baseUrl = url.split("/").slice(0, -1).join("/");
      const lines = body.toString().split("\n").map(line => {
        line = line.trim();
        if (line && !line.startsWith("#")) {
          if (line.startsWith("http")) {
            return `${req.protocol}://${req.get("host")}/proxy?url=${encodeURIComponent(line)}`;
          }
          return `${req.protocol}://${req.get("host")}/proxy?url=${encodeURIComponent(baseUrl + "/" + line)}`;
        }
        return line;
      });
      res.send(lines.join("\n"));
    } else {
      res.send(body); // сегменты .ts и другие файлы
    }
  });
});

app.get("/health", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
