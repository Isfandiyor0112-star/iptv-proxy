const express = require("express");
const request = require("request");
const app = express();

app.get("/proxy", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("No url provided");

  request(url)
    .on("response", (response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", response.headers["content-type"]);
    })
    .pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

