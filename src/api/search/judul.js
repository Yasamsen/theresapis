const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

  // 🎵 Endpoint Lirik
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
      const searchUrl = 'https://www.musixmatch.com/search/' + encodeURIComponent(judul);

      const { data: searchData } = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(searchData);

      const limk = 'https://www.musixmatch.com';
      const link = limk + $('div.media-card-body > div > h2').find('a').attr('href');

      const { data: lyricPage } = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $$ = cheerio.load(lyricPage);

      hasil.thumb = 'https:' + $$('div.col-sm-1.col-md-2.col-ml-3.col-lg-3.static-position > div > div > div').find('img').attr('src');
      $$('div.col-sm-10.col-md-8.col-ml-6.col-lg-6 > div.mxm-lyrics').each(function() {
        hasil.lirik = $$(this).find('span > p > span').text() + '\n' + $$(this).find('span > div > p > span').text();
      });

      res.json({
        status: true,
        creator: 'yasamDev',
        result: hasil
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};