const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {

  const BASE = 'https://kusonime.com';

  // 🔥 AXIOS INSTANCE SUPER HEADER
  const axiosInstance = axios.create({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Connection': 'keep-alive',
      'Referer': 'https://www.google.com/',
      'Cache-Control': 'no-cache'
    },
    timeout: 15000
  });

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // 🔥 FETCH DENGAN RETRY
  async function fetchWithRetry(url, retries = 2) {
    try {
      const { data } = await axiosInstance.get(url);
      return data;
    } catch (err) {
      if (retries > 0) {
        console.log('Retrying...', url);
        return await fetchWithRetry(url, retries - 1);
      }
      throw err;
    }
  }

  // 🔍 SEARCH
  async function searchKusonime(query) {
    const html = await fetchWithRetry(`${BASE}/?s=${encodeURIComponent(query)}&post_type=post`);

    const $ = cheerio.load(html);
    const results = [];

    $('.kover').each((_, el) => {
      const title = $(el).find('.episodeye a').text().trim();
      const link = $(el).find('.episodeye a').attr('href');
      const image = $(el).find('.thumbz img').attr('src');

      if (title) results.push({ title, link, image });
    });

    return results;
  }

  // 📄 DETAIL
  async function detailKusonime(url) {
    const html = await fetchWithRetry(url);

    const $ = cheerio.load(html);

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
          const linkUrl = $(a).attr('href');

          if (provider && linkUrl) {
            links.push({ provider, url: linkUrl });
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

  // 🔍 SEARCH ENDPOINT
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

  // 📄 DETAIL ENDPOINT
  app.get('/anime/kusonime-detail', async (req, res) => {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: 'Parameter url wajib diisi'
      });
    }

    try {
      url = decodeURIComponent(url);

      if (!isValidUrl(url)) {
        return res.status(400).json({
          status: false,
          error: 'Invalid URL'
        });
      }

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