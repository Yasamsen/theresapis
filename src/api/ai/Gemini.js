const axios = require('axios');

module.exports = function (app) {

  const BASE = 'https://www.neoapis.xyz/api/ai/gemini';

  app.get('/ai/gemini', async (req, res) => {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        error: 'Parameter text wajib diisi'
      });
    }

    try {
      const response = await axios.get(BASE, {
        params: { text },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
          'Referer': 'https://www.google.com/',
          'Origin': 'https://www.google.com'
        },
        timeout: 20000
      });

      // 🔥 kirim ulang response asli
      res.json(response.data);

    } catch (err) {
      console.error(err.response?.status || err.message);

      res.status(500).json({
        status: false,
        error: 'Failed fetch from Gemini API'
      });
    }
  });

};