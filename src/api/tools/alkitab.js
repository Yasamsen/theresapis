const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {

  // 🔍 SEARCH AYAT
  async function searchBible(query) {
    const url = `https://www.biblegateway.com/quicksearch/?quicksearch=${encodeURIComponent(query)}&version=TB`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.bible-item').each((_, el) => {
      const verse = $(el).find('.text').text().trim();
      const reference = $(el).find('.bible-item-title').text().trim();

      if (verse && reference) {
        results.push({ reference, verse });
      }
    });

    return results;
  }

  // 🎲 RANDOM AYAT (NYENTUH HATI)
  function randomPick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // 🔥 ENDPOINT SEARCH
  app.get('/tools/bible-search', async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        error: 'Parameter q wajib diisi'
      });
    }

    try {
      const results = await searchBible(q);

      res.json({
        status: true,
        total: results.length,
        result: results
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: 'Gagal mengambil ayat'
      });
    }
  });

  // 💖 ENDPOINT RANDOM (AUTO NYENTUH)
  app.get('/tools/bible-random', async (req, res) => {
    try {

      // 🔥 keyword emosional biar hasil relate
      const keywords = [
        "kasih",
        "harapan",
        "iman",
        "pengampunan",
        "kekuatan",
        "damai",
        "kesabaran"
      ];

      const randomKeyword = randomPick(keywords);

      const results = await searchBible(randomKeyword);

      if (!results.length) {
        return res.json({
          status: false,
          message: 'Tidak ada ayat ditemukan'
        });
      }

      const pick = randomPick(results);

      res.json({
        status: true,
        keyword: randomKeyword,
        result: pick
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: 'Gagal mengambil ayat random'
      });
    }
  });

};