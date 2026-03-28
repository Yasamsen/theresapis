const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://www.neoapis.xyz/api/ai/gpt?text=";

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/plain, */*"
  };

  async function fetchAI(query) {
    const { data } = await axios.get(
      API_URL + encodeURIComponent(query),
      {
        headers,
        timeout: 20000
      }
    );
    return data;
  }

  app.get("/ai/gpt", async (req, res) => {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        status: false,
        error: "Parameter text wajib diisi"
      });
    }

    try {
      const result = await fetchAI(text);

      if (!result?.status || !result?.data) {
        return res.status(500).json({
          status: false,
          error: "Gagal mendapatkan jawaban dari AI"
        });
      }

      res.json({
        status: true,
        model: result.model || "AI Model",
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