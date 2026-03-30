const axios = require('axios');

module.exports = function (app) {

  const APIs = [
    'https://api-faa.my.id/faa/google-image',
    'https://api.ryzendesu.vip/api/search/googleimage'
  ];

  function headers() {
    return {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
      'Referer': 'https://www.google.com/'
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

    for (let api of APIs) {
      try {
        const response = await axios.get(api, {
          params: { query },
          headers: headers(),
          timeout: 10000
        });

        return res.json(response.data);

      } catch (err) {
        console.log(`Gagal dari ${api}`);
      }
    }

    res.status(500).json({
      status: false,
      error: 'Semua API gagal / diblok'
    });
  });

};