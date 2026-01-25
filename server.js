import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
// Разрешаем CORS для твоего фронтенда
app.use(cors({ origin: "*" }));

const CHANNELS = {
  futboltvuz: "https://st.uzlive.ru/futboltvuz/",
  sportuztv: "https://st.uzlive.ru/sportuztv/",
  setanta1: "https://st.uzlive.ru/setanta-1/"
};

// Пинг для совместимости
app.get("/ping", (req, res) => res.status(200).send("pong"));

app.get("/channel/:name/*", async (req, res) => {
  const { name } = req.params;
  const rest = req.params[0];
  const baseUrl = CHANNELS[name];

  if (!baseUrl) return res.status(404).send("Канал не найден");

  const targetUrl = baseUrl + rest;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "Referer": "https://futboll.tv/",
        "Origin": "https://futboll.tv",
        "x-sid": "6929952d-3f2d-4883-aea8-542c9ab2e638"
      },
      // Таймаут чуть больше, чтобы тяжелые куски успевали подгрузиться
      timeout: 15000 
    });

    if (!response.ok) {
      return res.status(response.status).send("Ошибка источника");
    }

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // ПОЛНОЕ ПРОКСИРОВАНИЕ (Та самая "Труба")
    response.body.pipe(res);

    req.on("close", () => {
      if (response.body.destroy) response.body.destroy();
    });

  } catch (err) {
    if (!res.headersSent) res.status(500).send("Ошибка прокси");
  }
});

export default app;
