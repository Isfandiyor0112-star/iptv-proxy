const express = require('express');
const fetch = require('node-fetch');
const app = express();

const CHANNELS = {
  // Данные со скриншотов (ID 1010 и ID 1004)
  futbolltvuz: "https://stream2.itv.uz/t/6vFVvNHMTdkhR5BfWtk7yA/e/1769450730/1010/tracks-v1a1/",
  sportuztv: "https://stream6.itv.uz/t/HdmwT1i4nQ0KsYVgUX_-2Q/e/1769451986/1004/tracks-v1a1/"
};

app.get('/channel/:name/:file', async (req, res) => {
  const { name, file } = req.params;
  const baseUrl = CHANNELS[name];
  
  if (!baseUrl) return res.status(404).send("Channel not found");

  const targetUrl = baseUrl + file;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Referer": "https://itv.uz/",
        "Origin": "https://itv.uz",
        "Accept": "*/*"
      }
    });

    if (response.status === 403) {
      return res.status(403).send("ITV блокирует запрос. Проверь токен или регион сервера.");
    }

    // Пробрасываем поток видео в плеер
    response.body.pipe(res);
  } catch (e) {
    res.status(500).send("Proxy Error");
  }
});

module.exports = app;
