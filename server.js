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
      // ЗАМЕНЯЕМ ССЫЛКИ: превращаем "segment.ts" в "/channel/name/segment.ts"
      // Это заставит плеер качать видео через твой прокси
      const fixedContent = content.replace(/^(?!http)(.+)/gm, (match) => {
          return `/channel/${name}/${match}`;
      });
      
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(fixedContent);
    }

    // Для файлов .ts (видео) просто пробрасываем поток
    response.body.pipe(res);

  } catch (e) {
    res.status(500).send("Proxy Error");
  }
});

module.exports = app;
