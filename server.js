import express from "express";
import fetch from "node-fetch";

const app = express();

// Отдаём сайт из папки public
app.use(express.static("public"));

// Прокси для каналов
app.get("/channel/:name", async (req, res) => {
  const name = req.params.name;
  const url = `https://st.uzlive.ru/${name}/tracks-v1a1/mono.ts.m3u8`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://st.uzlive.ru/"
      }
    });
    if (!response.ok) {
      res.status(response.status).send("Ошибка доступа к каналу");
      return;
    }
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Ошибка прокси: " + err.message);
  }
});

// Пример пинга токенов
const TOKENS = ["token1", "token2"];
setInterval(() => {
  TOKENS.forEach(async token => {
    try {
      const r = await fetch(`https://tvcom/api/keepalive?token=${token}`);
      console.log(`Ping ${token}:`, r.status);
    } catch (e) {
      console.error(`Ошибка пинга ${token}:`, e.message);
    }
  });
}, 10000);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
