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

  try {
    const response = await axios.get('https://api-faa.my.id/faa/google-image', {
      params: { query },
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = response.data;

    // 🔥 mapping jadi object biar rapi
    const result = data.result.map((url, i) => ({
      id: i + 1,
      image: url
    }));

    res.json({
      status: true,
      total: result.length,
      result
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      error: 'Failed fetch Google Image API'
    });
  }
});