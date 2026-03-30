const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {

  // 🔥 BING HD SCRAPER
  async function scrapeBing(query) {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.iusc').each((i, el) => {
      const json = $(el).attr('m');

      if (json) {
        try {
          const parsed = JSON.parse(json);

          if (parsed.murl) {
            results.push(parsed.murl); // 🔥 HD IMAGE
          }

        } catch {}
      }
    });

    return results;
  }

  // 🔥 DUCK SCRAPER (fallback)
  async function scrapeDuck(query) {
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');

      if (src && src.startsWith('http')) {
        results.push(src);
      }
    });

    return results;
  }

  // 🔥 FILTER HD
  function filterImages(list) {
    return list.filter(url =>
      url.match(/\.(jpg|jpeg|png|webp)/i)
    );
  }

  // 🚀 ENDPOINT
  app.get('/tools/google-image', async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        error: 'Parameter query wajib diisi'
      });
    }

    // 🔥 1. BING (PRIORITAS)
    try {
      let bing = await scrapeBing(query);
      bing = filterImages(bing);

      if (bing.length) {
        return res.json({
          status: true,
          source: 'bing',
          total: bing.length,
          result: bing.slice(0, 10)
        });
      }

    } catch (e) {
      console.log('Bing gagal...');
    }

    // 🔥 2. DUCK (FALLBACK)
    try {
      let duck = await scrapeDuck(query);
      duck = filterImages(duck);

      if (duck.length) {
        return res.json({
          status: true,
          source: 'duckduckgo',
          total: duck.length,
          result: duck.slice(0, 10)
        });
      }

    } catch (e) {
      console.log('Duck gagal...');
    }

    // ❌ ERROR FINAL
    res.status(500).json({
      status: false,
      error: 'Semua scraper gagal'
    });
  });

};