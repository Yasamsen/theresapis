const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://www.neoapis.xyz/api/tools/removebg?url=";

  const headers = {
    "User-Agent": "Mozilla/5.0"
  };

  async function removeBG(imageUrl) {
    const response = await axios.get(
      API_URL + encodeURIComponent(imageUrl),
      {
        headers,
        responseType: "arraybuffer", // 🔥 penting!
        timeout: 20000
      }
    );
    return response;
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

      // 🔥 kirim langsung sebagai image
      res.set("Content-Type", "image/png");
      res.send(result.data);

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};