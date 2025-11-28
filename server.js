import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));

const CHANNELS = {
  futboltvuz: "https://st.uzlive.ru/futboltvuz/index.m3u8",
  sporttvuz: "https://st.uzlive.ru/sportuztv/index.m3u8",
  setanta1: "https://st.uzlive.ru/setanta-1/index.m3u8"
};

app.get("/channel/:name", async (req, res) => {
  const url = CHANNELS[req.params.name];
  if (!url) return res.status(404).send("Канал не найден");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "Referer": "https://futboll.tv/",
        "Origin": "https://futboll.tv",
        "Accept": "*/*",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd"
        // Если появятся куки или x-vsaas-session — добавь сюда
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

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

