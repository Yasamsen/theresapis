const axios = require('axios');
const FormData = require('form-data');

module.exports = function (app) {

  const baseUrl = 'https://hdvideo.tr';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'Origin': baseUrl,
    'Referer': baseUrl + '/'
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function prepareDownload(url, formatType) {
    const form = new FormData();
    form.append('url', url);
    form.append('format_type', formatType);
    form.append('agree_terms', 'on');

    const { data } = await axios.post(baseUrl + '/api/prepare', form, {
      headers: {
        ...headers,
        ...form.getHeaders()
      }
    });

    return data;
  }

  async function checkStatus(jobId) {
    const { data } = await axios.get(baseUrl + '/api/status/' + jobId, {
      headers
    });
    return data;
  }

  async function wait(jobId) {
    for (let i = 0; i < 30; i++) {
      const res = await checkStatus(jobId);

      if (res.status === 'completed') return res;
      if (res.status === 'failed') return res;

      await sleep(2000);
    }

    return { status: 'timeout' };
  }

  app.get('/tools/hdvideo', async (req, res) => {
    const { url, format } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        creator: "yasamDev",
        error: "Parameter url wajib diisi"
      });
    }

    try {
      const formatType = format || 'mp4';

      const prep = await prepareDownload(url, formatType);

      if (prep.status !== 'started') {
        return res.status(500).json({
          status: false,
          creator: "yasamDev",
          error: "Gagal memulai proses",
          detail: prep
        });
      }

      const result = await wait(prep.job_id);

      res.json({
        status: result.status === 'completed',
        creator: "yasamDev",
        result: {
          jobId: prep.job_id,
          format: formatType,
          data: result
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "yasamDev",
        error: err.message
      });
    }
  });

};