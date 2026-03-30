const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.google.com/"
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
      const hasil = {};
      const base = 'https://www.musixmatch.com';

      // 🔎 Search
      const { data: searchData } = await axios.get(
        base + '/search/' + encodeURIComponent(judul),
        { headers }
      );

      const $ = cheerio.load(searchData);

      const path = $('a.title').attr('href') ||
                   $('div.media-card-body a').attr('href');

      if (!path) throw new Error('Lagu tidak ditemukan');

      const link = base + path;

      // 🎵 Ambil halaman lirik
      const { data: lyricPage } = await axios.get(link, { headers });
      const $$ = cheerio.load(lyricPage);

      hasil.thumb = 'https:' + ($$('img.mxm-track-cover__image').attr('src') || '');

      let lirik = '';
      $$('div.mxm-lyrics span').each((i, el) => {
        lirik += $$(el).text() + '\n';
      });

      hasil.lirik = lirik.trim();

      res.json({
        status: true,
        creator: 'yasamDev',
        result: hasil
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