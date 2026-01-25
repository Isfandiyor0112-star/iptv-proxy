const express = require('express');
const fetch = require('node-fetch');
const app = express();

const CHANNELS = {
  // Твои проверенные данные
  futbolltvuz: "https://stream2.itv.uz/t/6vFVvNHMTdkhR5BfWtk7yA/e/1769450730/1010/tracks-v1a1/",
  sportuztv: "https://stream6.itv.uz/t/HdmwT1i4nQ0KsYVgUX_-2Q/e/1769451986/1004/tracks-v1a1/"
};

app.get('/channel/:name/:file', async (req, res) => {
  const { name, file } = req.params;
  const baseUrl = CHANNELS[name];
  
  if (!baseUrl) return res.status(404).send("Channel not found");

  // Умная замена: если просят index, отдаем mono
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

    if (response.status !== 200) {
      return res.status(response.status).send(`ITV error: ${response.status}`);
    }

    // ЕСЛИ ЭТО ПЛЕЙЛИСТ (.m3u8), нам нужно изменить ссылки внутри него
    if (targetFile.endsWith('.m3u8')) {
      let content = await response.text();
      // Это магия: заменяем относительные ссылки на полные через наш прокси
      // Теперь каждый .ts файл пойдет через твой Vercel
      const proxyPath = `/channel/${name}/`;
      const fixedContent = content.replace(/^(?!http)(.+)/gm, `${proxyPath}$1`);
      
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(fixedContent);
    }

    // ЕСЛИ ЭТО ВИДЕО (.ts), просто передаем поток данных
    response.body.pipe(res);

  } catch (e) {
    console.error("Proxy Error:", e);
    res.status(500).send("Proxy Error");
  }
});

module.exports = app;
