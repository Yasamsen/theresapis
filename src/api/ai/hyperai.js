const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://api-faa.my.id/faa/ai-hyper?text=";

  async function aihyper(text) {
    const { data } = await axios.get(
      API_URL + encodeURIComponent(text),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        },
        timeout: 30000
      }
    );
    return data;
  }

  app.get("/ai/ai-hyper", async (req, res) => {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        error: "Parameter text wajib diisi"
      });
    }

    try {
      const result = await aihyper(text);

      if (!result?.status) {
        return res.status(500).json({
          status: false,
          error: "Gagal mendapatkan respon AI"
        });
      }

      res.json({
        status: true,
        result: result.result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};