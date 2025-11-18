const express = require("express");
const request = require("request");
const app = express();

app.get("/proxy", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("No url provided");

  request(url, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(500).send("Failed to fetch playlist");
    }

    // Переписываем все http-ссылки внутри
    const lines = body.split("\n").map(line => {
      if (line.startsWith("http://")) {
        line = line.replace("http://", "https://");
      }
      if (line.startsWith("https://")) {
        line = `https://iptv-proxy-m2sm.onrender.com/proxy?url=${encodeURIComponent(line)}`;
      }
      return line;
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/x-mpegURL");
    res.send(lines.join("\n"));
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
