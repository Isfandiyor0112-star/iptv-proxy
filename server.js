import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.static("public"));

// список каналов
const CHANNELS = {
  sportuztv: "https://st.uzlive.ru/sportuztv/tracks-v1a1/mono.ts.m3u8",
  futboltvuz: "https://st.uzlive.ru/futboltvuz/tracks-v1a1/mono.ts.m3u8",
  setanta1: "https://st.uzlive.ru/setanta-1/tracks-v1a1/mono.ts.m3u8"
};

// универсальный прокси
app.get("/channel/:name", async (req, res) => {
  const url = CHANNELS[req.params.name];
  if (!url) {
    res.status(404).send("Канал не найден");
    return;
  }

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

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
