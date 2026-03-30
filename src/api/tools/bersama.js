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

      // ❌ jangan encode 2x
      const apiUrl = `${BASE}?url1=${url1}&url2=${url2}`;

      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'stream', // pakai stream untuk image besar
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept":
            "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.google.com/",
          "Origin": "https://www.google.com",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "no-cors",
          "Sec-Fetch-Site": "cross-site"
        },
        maxRedirects: 5,
        timeout: 30000
      });

      // 🔥 langsung pipe ke response
      res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
      response.data.pipe(res);

    } catch (err) {
      console.error("Tobersama V2 ERROR:", err.response?.status || err.message);

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.response?.status
          ? `Upstream error ${err.response.status}`
          : 'Failed fetch Tobersama V2 API'
      });
    }
  });
};