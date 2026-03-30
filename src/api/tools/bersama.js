const axios = require('axios');

module.exports = function (app) {

  const BASE = 'https://api-faa.my.id/faa/tobersamav2';

  app.get('/tools/tobersama-v2', async (req, res) => {
    try {
      const { url1, url2 } = req.query;

      if (!url1 || !url2) {
        return res.status(400).json({
          status: false,
          error: 'url1 dan url2 wajib diisi'
        });
      }

      const apiUrl = `${BASE}?url1=${encodeURIComponent(url1)}&url2=${encodeURIComponent(url2)}`;

      const response = await axios.get(apiUrl, {
  responseType: 'arraybuffer',
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    "Accept":
      "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",

    "Accept-Language": "en-US,en;q=0.9",

    "Accept-Encoding": "gzip, deflate, br",

    "Referer": "https://www.google.com/",

    "Origin": "https://www.google.com",

    "Connection": "keep-alive",

    "Cache-Control": "no-cache",

    "Pragma": "no-cache"
  },
  timeout: 20000
});

      // 🔥 kirim langsung image
      res.setHeader('Content-Type', 'image/png');
      res.send(response.data);

    } catch (err) {
      console.error(err.response?.status || err.message);

      res.status(500).json({
        status: false,
        error: 'Failed fetch Tobersama V2 API'
      });
    }
  });

};