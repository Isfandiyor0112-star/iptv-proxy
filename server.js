const express = require('express');
const fetch = require('node-fetch');
const app = express();

const CHANNELS = {
  futbolltvuz: "https://stream2.itv.uz/t/6vFVvNHMTdkhR5BfWtk7yA/e/1769450730/1010/tracks-v1a1/",
  sportuztv: "https://stream6.itv.uz/t/HdmwT1i4nQ0KsYVgUX_-2Q/e/1769451986/1004/tracks-v1a1/",
  setanta1: "https://stream2.itv.uz/t/6vFVvNHMTdkhR5BfWtk7yA/e/1769450730/1012/tracks-v1a1/"
};

// Полная CORS поддержка для работы плеера на фронтенде
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
  
  if (!baseUrl) {
    console.error(`Канал ${name} не найден в списке CHANNELS`);
    return res.status(404).send("Channel not found");
  }

  // Проверяем, запрашивается ли плейлист (index.m3u8, mono.m3u8 и т.д.)
  const isPlaylist = file.endsWith('.m3u8');
  const targetFile = (file === 'index.m3u8') ? 'mono.m3u8' : file;
  
  // Собираем ссылку на оригинальный файл на сервере itv.uz
  // Передаем query-параметры (например, токен времени ?t=...), если они пришли от плеера
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const targetUrl = baseUrl + targetFile + queryString;

  // ЕСЛИ ЭТО ТЯЖЕЛЫЙ ВЕДЕО-СЕГМЕНТ (.ts, .m4v, .mp4) -> ОТПРАВЛЯЕМ В РЕДИРЕКТ
  if (!isPlaylist) {
    // Vercel не качает видео через себя, а просто говорит плееру: "Возьми тут"
    return res.redirect(302, targetUrl);
  }

  // ЕСЛИ ЭТО ТЕКСТОВЫЙ ПЛЕЙЛИСТ -> СКАНЕРУЕМ И ПОДМЕНЯЕМ ССЫЛКИ
  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",
        "Referer": "https://itv.uz/",
        "Origin": "https://itv.uz"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send("Error fetching playlist from source");
    }

    let content = await response.text();
    
    // Формируем базовый путь к нашему прокси на Vercel
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.get('host');
    const proxyPath = `${protocol}://${host}/channel/${name}/`;
    
    // Заменяем относительные ссылки на абсолютные пути к нашему прокси
    const fixedContent = content.replace(/^(?!http)(.+)/gm, `${proxyPath}$1`);
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    return res.send(fixedContent);

  } catch (e) {
    console.error("Ошибка проксирования плейлиста:", e);
    if (!res.headersSent) res.status(500).send("Proxy Error");
  }
});

module.exports = app;
