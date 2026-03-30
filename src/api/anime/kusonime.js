const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {

  const BASE = 'https://kusonime.com';

  async function searchKusonime(query) {
    const { data } = await axios.get(`${BASE}/?s=${encodeURIComponent(query)}&post_type=post`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.kover').each((_, el) => {
      const title = $(el).find('.episodeye a').text().trim();
      const link = $(el).find('.episodeye a').attr('href');
      const image = $(el).find('.thumbz img').attr('src');

      if (title) results.push({ title, link, image });
    });

    return results;
  }

  async function detailKusonime(url) {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(data);

    const title = $('h1.jdlz').text().trim();
    const image = $('.post-thumb img').attr('src');
    const sinopsis = $('.lexot p').first().text().trim();

    const download = [];

    $('.smokeddlrh').each((_, el) => {
      const batch = $(el).find('.smokettlrh').text().trim();
      const qualities = [];

      $(el).find('.smokeurlrh').each((_, q) => {
        const quality = $(q).find('strong').text().trim();

        const links = [];
        $(q).find('a').each((_, a) => {
          const provider = $(a).text().trim();
          const url = $(a).attr('href');

          if (provider && url) {
            links.push({ provider, url });
          }
        });

        if (quality && links.length) {
          qualities.push({ quality, links });
        }
      });

      if (batch && qualities.length) {
        download.push({ batch, qualities });
      }
    });

    return { title, image, sinopsis, download };
  }

  // 🔍 SEARCH
  app.get('/anime/kusonime', async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        error: 'Parameter query wajib diisi'
      });
    }

    try {
      const result = await searchKusonime(query);

      res.json({
        status: true,
        total: result.length,
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

  // 📄 DETAIL
  app.get('/anime/kusonime-detail', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: 'Parameter url wajib diisi'
      });
    }

    try {
      const result = await detailKusonime(url);

      res.json({
        status: true,
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};