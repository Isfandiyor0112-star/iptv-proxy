const express = require('express');
const fetch = require('node-fetch');
const app = express();

const CHANNELS = {
  // Проверь, чтобы названия ключей совпадали с тем, что ты запрашиваешь в ссылке
  futbolltvuz: "https://stream2.itv.uz/t/6vFVvNHMTdkhR5BfWtk7yA/e/1769450730/1010/tracks-v1a1/",
  sportuztv: "https://stream6.itv.uz/t/HdmwT1i4nQ0KsYVgUX_-2Q/e/1769451986/1004/tracks-v1a1/",
  // Добавил Сетанту сюда, так как в логах была она
  setanta1: "https://stream2.itv.uz/t/6vFVvNHMTdkhR5BfWtk7yA/e/1769450730/1012/tracks-v1a1/"
};

// РЕШЕНИЕ CORS: Добавляем заголовки для всех запросов
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/channel/:name/:file', async (req, res) => {
  const { name, file } = req.params;
  const baseUrl = CHANNELS[name];
  
  // Если канала нет, отдаем 404, а не 500
  if (!baseUrl) {
    console.error(`Канал ${name} не найден в списке CHANNELS`);
    return res.status(404).send("Channel not found");
  }

  const isPlaylist = file.endsWith('.m3u8') || file === 'index.m3u8';
  const targetFile = (file === 'index.m3u8') ? 'mono.m3u8' : file;
  const targetUrl = baseUrl + targetFile;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://itv.uz/",
        "Origin": "https://itv.uz"
      }
    });

    if (isPlaylist) {
      let content = await response.text();
      
      // Используем абсолютные ссылки, чтобы плеер на Onrender точно их нашел
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.get('host');
      const proxyPath = `${protocol}://${host}/channel/${name}/`;
      
      const fixedContent = content.replace(/^(?!http)(.+)/gm, `${proxyPath}$1`);
      
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(fixedContent);
    }

    // Для .ts файлов передаем поток
    res.setHeader('Content-Type', 'video/MP2T');
    response.body.pipe(res);

  } catch (e) {
    console.error("Ошибка прокси:", e);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

module.exports = app;
