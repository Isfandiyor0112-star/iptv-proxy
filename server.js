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

// 1. ПИНГ ВЫНЕСЕН НАРУЖУ (теперь Cron будет работать правильно)
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

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
      // Таймаут важен, чтобы прокси не "зависал" на плохих сегментах
      timeout: 10000 
    });

    if (!response.ok) {
      return res.status(response.status).send("Ошибка источника");
    }

    // 2. ФИКС ЛАГОВ: Пробрасываем Content-Type (m3u8 или video/mp2t)
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // 3. СТРИМИНГ БЕЗ БУФЕРА (Прямая труба)
    response.body.pipe(res);

    // Очистка памяти при закрытии плеера пользователем
    req.on("close", () => {
      if (response.body.destroy) response.body.destroy();
    });

  } catch (err) {
    console.error("Ошибка:", err.message);
    if (!res.headersSent) res.status(500).send("Ошибка прокси");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy active on port ${PORT}`));
