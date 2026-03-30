const axios = require('axios');

async function Spotifysearch(query) {
  try {
    if (!query) return null;

    const { data } = await axios.get(
      'https://sa.caliph.eu.org/api/search/tracks',
      {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        },
        timeout: 20000
      }
    );

    // 🔥 ambil yang penting aja
    const results = (data.data || []).map(item => ({
      title: item.title,
      artist: item.artist,
      duration: item.duration,
      url: item.url,
      thumbnail: item.thumbnail
    }));

    return results;

  } catch (error) {
    console.error(error.message);
    return null;
  }
}

module.exports = function (app) {

  app.get('/tools/spotify-search', async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        error: 'Parameter q wajib diisi'
      });
    }

    try {
      const result = await Spotifysearch(q);

      res.json({
        status: true,
        total: result?.length || 0,
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: 'Gagal mengambil data Spotify'
      });
    }
  });

};