const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {

  // 🔥 SCRAPER BING
  async function scrapeBing(query) {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;

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

  // 🔥 SCRAPER DUCKDUCKGO
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

  // 🔥 ENDPOINT
  app.get('/tools/google-image', async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        error: 'Parameter query wajib diisi'
      });
    }

    // 🔥 TRY BING
    try {
      const bing = await scrapeBing(query);
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

    // 🔥 TRY DUCKDUCKGO
    try {
      const duck = await scrapeDuck(query);
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

    res.status(500).json({
      status: false,
      error: 'Semua scraper gagal'
    });
  });

};