import express from 'express';
import fetch from 'node-fetch';

const app = express();

const CHANNELS = {
  futboltvuz: "https://stream5.itv.uz/t/tXBcFpCOrbUUOv-5LoYavA/e/1784540920/1004/tracks-v1a1/",
  sportuztv: "https://stream17.itv.uz/t/pbK7jqujEp1Ei7NGBDXQNw/e/1784542449/1004/tracks-v1a1/",
  setanta1: "https://stream5.itv.uz/t/tXBcFpCOrbUUOv-5LoYavA/e/1784540920/1004/tracks-v1a1/"
};

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Нам нужен только один роут — для получения плейлиста!
app.get('/channel/:name/index.m3u8', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  const { name } = req.params;
  const baseUrl = CHANNELS[name];
  
  if (!baseUrl) {
    return res.status(404).send(`Channel ${name} not found`);
  }

  // Запрашиваем оригинальный mono.m3u8 с itv.uz через сервер (чтобы обойти CORS на сам текст)
  const targetUrl = baseUrl + 'mono.m3u8';

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",
        "Referer": "https://itv.uz/",
        "Origin": "https://itv.uz"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Source error ${response.status}`);
    }

    let content = await response.text();
    
    // ВНИМАНИЕ: Подставляем в начало строк не свой прокси, а ОРИГИНАЛЬНЫЙ baseUrl от itv.uz!
    // Это заставит телефон/пк пользователя качать видео-кусочки НАПРЯМУЮ с itv.uz
    const fixedContent = content.replace(/^(?!http|#)(.+)/gm, `${baseUrl}$1`);
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    return res.send(fixedContent);

  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
});

export default app;
