const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://api-faa.my.id/faa/ai-hyper?text=";

async function aihyper(text) {
  try {
    const { data } = await axios.get(
      API_URL + encodeURIComponent(text),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://api-faa.my.id/",
          "Origin": "https://api-faa.my.id"
        },
        timeout: 30000
      }
    );
    return data;
  } catch (err) {
    console.log("AI-HYPER ERROR:", err.response?.status);

    return {
      status: false,
      error: "API blocked / error"
    };
  }
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