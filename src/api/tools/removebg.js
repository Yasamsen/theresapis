const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://www.neoapis.xyz/api/tools/removebg?url=";

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/plain, */*"
  };

  async function removeBG(imageUrl) {
    const { data } = await axios.get(
      API_URL + encodeURIComponent(imageUrl),
      {
        headers,
        timeout: 20000
      }
    );
    return data;
  }

  app.get("/tools/removebg", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Parameter url wajib diisi"
      });
    }

    try {
      const result = await removeBG(url);

      if (!result?.status || !result?.data) {
        return res.status(500).json({
          status: false,
          error: "Gagal menghapus background"
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