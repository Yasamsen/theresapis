const axios = require('axios');

module.exports = function (app) {

  const BASE = 'https://api-faa.my.id/faa/google-image';

  // 🔥 USER AGENT ROTATE
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Version/15.0 Mobile Safari/604.1'
  ];

  function createHeaders() {
    return {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.com/',
      'Origin': 'https://www.google.com',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

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
        headers: createHeaders(),
        timeout: 20000
      });

      res.json(response.data);

    } catch (err) {
      console.error('ERROR:', err.response?.status, err.message);

      res.status(500).json({
        status: false,
        error: err.response?.status === 403
          ? 'Blocked by target API (403)'
          : 'Failed fetch Google Image API'
      });
    }
  });

};