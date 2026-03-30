const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
    "Origin": "https://www.musixmatch.com",
    "Connection": "keep-alive",

    // 🔥 penting (biar lolos bot detection)
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",

    // 🔥 cookie manual (wajib)
    "Cookie": "x-mxm-token-guid=12345678; x-mxm-user-id=anonymous;"
  };

  app.get('/tools/lirik', async (req, res) => {
    const { judul } = req.query;

    if (!judul) {
      return res.status(400).json({
        status: false,
        error: 'Parameter judul wajib diisi'
      });
    }

    try {
      const base = 'https://www.musixmatch.com';

      // 🔎 SEARCH
      const search = await axios.get(base + '/search/' + encodeURIComponent(judul), { headers });
      const $ = cheerio.load(search.data);

      const path = $('a.title').attr('href') || $('div.media-card-body a').attr('href');
      if (!path) throw new Error('Lagu tidak ditemukan');

      // 🎵 DETAIL
      const detail = await axios.get(base + path, { headers });
      const $$ = cheerio.load(detail.data);

      let lirik = '';
      $$('div.mxm-lyrics span').each((i, el) => {
        lirik += $$(el).text() + '\n';
      });

      res.json({
        status: true,
        creator: 'yasamDev',
        result: {
          thumb: 'https:' + ($$('img').attr('src') || ''),
          lirik: lirik.trim()
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: 'yasamDev',
        error: err.message
      });
    }
  });

};