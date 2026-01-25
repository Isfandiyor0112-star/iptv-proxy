const express = require('express');
const fetch = require('node-fetch');
const app = express();

const CHANNELS = {
  futbolltvuz: "https://stream2.itv.uz/t/6vFVvNHMTdkhR5BfWtk7yA/e/1769450730/1010/tracks-v1a1/",
  sportuztv: "https://stream6.itv.uz/t/HdmwT1i4nQ0KsYVgUX_-2Q/e/1769451986/1004/tracks-v1a1/"
};

app.get('/channel/:name/:file', async (req, res) => {
  const { name, file } = req.params;
  const baseUrl = CHANNELS[name];
  
  if (!baseUrl) return res.status(404).send("Channel not found");

  // ITV часто использует mono.m3u8 внутри своих систем
  const isPlaylist = file.endsWith('.m3u8') || file === 'index.m3u8';
  const targetFile = (file === 'index.m3u8') ? 'mono.m3u8' : file;
  const targetUrl = baseUrl + targetFile;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Referer": "https://itv.uz/",
        "Origin": "https://itv.uz"
      }
    });

    if (isPlaylist) {
      let content = await response.text();
      
      // КЛЮЧЕВОЙ МОМЕНТ: Заменяем относительные ссылки на сегменты .ts
      // Чтобы плеер запрашивал их через наш прокси: /channel/имя/файл.ts
      const fixedContent = content.replace(/^(?!http)(.+)/gm, `/channel/${name}/$1`);
      
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*'); // Для работы в браузере
      return res.send(fixedContent);
    }

    // Для видео-файлов (.ts) просто передаем поток
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.body.pipe(res);

  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Proxy Error");
  }
});

module.exports = app;
