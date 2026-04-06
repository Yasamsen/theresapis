const axios = require('axios');
const https = require('https');

module.exports = function (app) {

  const BASE = 'https://api-faa.my.id/faa/tobersamav2';

  app.get('/maker/tobersama-v2', async (req, res) => {
    try {
      const { url1, url2 } = req.query;

      if (!url1 || !url2) {
        return res.status(400).json({
          status: false,
          error: 'url1 dan url2 wajib diisi'
        });
      }

      const apiUrl = `${BASE}?url1=${url1}&url2=${url2}`;

      // 🔥 HTTPS agent (biar lebih stabil & bypass beberapa limit)
      const agent = new https.Agent({
        rejectUnauthorized: false
      });

      const response = await axios({
        method: 'GET',
        url: apiUrl,
        responseType: 'stream',
        httpsAgent: agent,
        maxRedirects: 5,
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

          "Accept":
            "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",

          "Accept-Language": "en-US,en;q=0.9",

          "Referer": "https://www.google.com/",

          "Origin": "https://www.google.com",

          "Connection": "keep-alive",

          "Cache-Control": "no-cache",

          "Pragma": "no-cache",

          // 🔥 tambahan biar makin legit
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "no-cors",
          "Sec-Fetch-Site": "cross-site",

          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"'
        }
      });

      res.setHeader(
        'Content-Type',
        response.headers['content-type'] || 'image/png'
      );

      response.data.pipe(res);

    } catch (err) {

      console.error("ERROR:", err.response?.status, err.message);

      // 🔥 fallback simple kalau 403
      if (err.response?.status === 403) {
        return res.status(500).json({
          status: false,
          creator: "yasamDev",
          error: "Blocked by upstream (403) - kemungkinan IP server diblokir"
        });
      }

      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: "Failed fetch Tobersama V2 API"
      });
    }
  });

};