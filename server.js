import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));

const CHANNELS = {
  futboltvuz: "https://st.uzlive.ru/futboltvuz/",
  sportuztv: "https://st.uzlive.ru/sportuztv/",
  setanta1: "https://st.uzlive.ru/setanta-1/",
  // Добавил Сетанту 2 (путь из твоего лога)
  setanta2: "https://vod.splay.uz/live_splay/original/Setanta2HD/"
};

app.get("/ping", (req, res) => res.status(200).send("pong"));

app.get("/channel/:name/*", async (req, res) => {
  const { name } = req.params;
  const rest = req.params[0];
  const baseUrl = CHANNELS[name];

  if (!baseUrl) return res.status(404).send("Канал не найден");

  const targetUrl = baseUrl + rest;
  const urlObj = new URL(targetUrl);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        // ПРИТВОРЯЕМСЯ ЖИВЫМ САЙТОМ
        "Referer": "https://itv.uz/",
        "Origin": "https://itv.uz",
        "Host": urlObj.host, // Очень важно для splay.uz
        "Accept": "*/*",
        "Connection": "keep-alive"
      },
      timeout: 15000 
    });

    if (!response.ok) {
      // Если 403, пробуем передать статус дальше для отладки
      return res.status(response.status).send(`Ошибка источника: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    response.body.pipe(res);

    req.on("close", () => {
      if (response.body.destroy) response.body.destroy();
    });

  } catch (err) {
    if (!res.headersSent) res.status(500).send("Ошибка прокси");
  }
});

export default app;
