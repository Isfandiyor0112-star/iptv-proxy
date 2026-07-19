import express from 'express';
import fetch from 'node-fetch';

const app = express();

// Сюда вставляй актуальные ссылки со свежими токенами из панели разработчика!
const CHANNELS = {
  futboltvuz: "https://stream5.itv.uz/t/tXBcFpCOrbUUOv-5LoYavA/e/1784540920/1004/tracks-v1/",
  sportuztv: "https://stream5.itv.uz/t/tXBcFpCOrbUUOv-5LoYavA/e/1784540920/1004/tracks-v1/",
  setanta1: "https://stream5.itv.uz/t/tXBcFpCOrbUUOv-5LoYavA/e/1784540920/1004/tracks-v1/"
};

// Полная поддержка CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/channel/:name/:file', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  const { name, file } = req.params;
  const baseUrl = CHANNELS[name];
  
  if (!baseUrl) {
    console.error(`Канал не найден: ${name}`);
    return res.status(404).send(`Channel ${name} not found in config`);
  }

  const isPlaylist = file.endsWith('.m3u8');
  const targetFile = (file === 'index.m3u8') ? 'mono.m3u8' : file;
  
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const targetUrl = baseUrl + targetFile + queryString;

  // Если это тяжелый видео-фрагмент — отправляем в редирект
  if (!isPlaylist) {
    return res.redirect(302, targetUrl);
  }

  // Если это текстовый плейлист — парсим его
  try {
    console.log(`Запрос к itv.uz: ${targetUrl}`);
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",
        "Referer": "https://itv.uz/",
        "Origin": "https://itv.uz"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`itv.uz вернул ошибку ${response.status}: ${errText}`);
      return res.status(response.status).send(`Source returned error ${response.status}`);
    }

    let content = await response.text();
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.get('host');
    const proxyPath = `${protocol}://${host}/channel/${name}/`;
    
    const fixedContent = content.replace(/^(?!http)(.+)/gm, `${proxyPath}$1`);
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    return res.send(fixedContent);

  } catch (e) {
    console.error("Критическая ошибка на бэкенде:", e.message);
    return res.status(500).send(`Internal Proxy Error: ${e.message}`);
  }
});

// Для работы на Vercel экспортируем приложение как дефолтный модуль
export default app;
