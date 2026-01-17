import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));

const CHANNELS = {
  futboltvuz: "https://st.uzlive.ru/futboltvuz/",
  sportuztv: "https://st.uzlive.ru/sportuztv/",
  setanta1: "https://st.uzlive.ru/setanta-1/"
};

app.get("/channel/:name/*", async (req, res) => {
  const { name } = req.params;
  const rest = req.params[0];
  const baseUrl = CHANNELS[name];
  if (!baseUrl) return res.status(404).send("Not Found");

  const targetUrl = baseUrl + rest;

  // ЭКОНОМИЯ ТРАФИКА:
  // Если это видео (.ts), кидаем редирект. 
  // Браузеры обычно разрешают редирект на видео даже с CORS, 
  // если манифест уже был получен через прокси.
  if (targetUrl.toLowerCase().endsWith(".ts")) {
    return res.redirect(302, targetUrl);
  }

  // Проксируем только плейлист .m3u8 (несколько КБ)
  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://futboll.tv/",
        "Origin": "https://futboll.tv",
        "x-sid": "6929952d-3f2d-4883-aea8-542c9ab2e638"
      },
      timeout: 10000 
    });

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Error");
  }
});

export default app;
