const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://www.neoapis.xyz/api/downloader/ytdl?url=";

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/plain, */*"
  };

  async function ytdl(url, type) {
    const { data } = await axios.get(
      API_URL + encodeURIComponent(url) + "&type=" + encodeURIComponent(type),
      {
        headers,
        timeout: 20000
      }
    );
    return data;
  }

  app.get("/downloader/ytdl", async (req, res) => {
    const { url, type } = req.query;

    if (!url || !type) {
      return res.status(400).json({
        status: false,
        error: "Parameter url dan type wajib diisi"
      });
    }

    try {
      const result = await ytdl(url, type);

      if (!result?.status || !result?.data) {
        return res.status(500).json({
          status: false,
          error: "Gagal mengambil data video"
        });
      }

      res.json({
        status: true,
        result: result.data
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};