const axios = require('axios');

module.exports = function (app) {

  const BASE = 'https://api-faa.my.id/faa/google-image';

  app.get('/tools/google-image', async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        error: 'Parameter query wajib diisi'
      });
    }

    try {
      const response = await axios.get(BASE, {
        params: { query },
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
          'Referer': 'https://www.google.com/',
          'Origin': 'https://www.google.com'
        },
        timeout: 20000
      });

      res.json(response.data);

    } catch (err) {
      console.error(err.response?.status || err.message);

      res.status(500).json({
        status: false,
        error: 'Failed fetch Google Image API'
      });
    }
  });

};