const axios = require('axios');

// 🔥 USER AGENT ROTATOR
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Version/15.0 Mobile Safari/604.1'
];

// 🔥 CACHE
const cache = new Map();

function setCache(key, data) {
  cache.set(key, {
    data,
    expire: Date.now() + 60 * 1000
  });
}

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expire) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

// 🔥 AXIOS
function createAxios() {
  return axios.create({
    headers: {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      'Accept': 'image/*,*/*;q=0.8',
      'Referer': 'https://www.google.com/',
      'Origin': 'https://www.google.com'
    },
    timeout: 20000
  });
}

module.exports = function (app) {

  const BASE = 'https://www.neoapis.xyz/api/maker/brat';

  app.get('/tools/brat', async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        error: 'Parameter q wajib diisi'
      });
    }

    try {
      // 🔥 cache
      const cached = getCache(q);
      if (cached) {
        res.setHeader('Content-Type', cached.type);
        return res.send(cached.buffer);
      }

      const url = `${BASE}?q=${encodeURIComponent(q)}`;
      const axiosInstance = createAxios();

      const response = await axiosInstance.get(url, {
        responseType: 'arraybuffer'
      });

      const contentType = response.headers['content-type'] || 'image/png';

      setCache(q, {
        buffer: response.data,
        type: contentType
      });

      res.setHeader('Content-Type', contentType);
      res.send(response.data);

    } catch (err) {
      res.status(500).json({
        status: false,
        error: 'Failed fetch from base API'
      });
    }
  });

};