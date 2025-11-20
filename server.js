const express = require("express");
const request = require("request");
const app = express();

app.get("/proxy", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("No url provided");

  app.get("/health", (req, res) => {
  res.send("OK");
});


  request({ url, encoding: null })
    .on("response", (response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");
    })
    .on("error", () => {
      res.status(500).send("Proxy error");
    })
    .pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
