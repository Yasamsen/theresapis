const axios = require("axios");

module.exports = function (app) {

  const API_URL = "https://api-faa.my.id/faa/gpt-promt";

  async function gptPromt(prompt, text) {
    const { data } = await axios.get(API_URL, {
      params: { prompt, text },
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://api-faa.my.id/",
        "Origin": "https://api-faa.my.id"
      },
      timeout: 30000
    });
    return data;
  }

  app.get("/ai/gpt-promt", async (req, res) => {
    const { prompt, text } = req.query;

    if (!prompt || !text) {
      return res.status(400).json({
        status: false,
        error: "Parameter prompt dan text wajib diisi"
      });
    }

    try {
      const result = await gptPromt(prompt, text);

      if (!result?.status) {
        return res.json({
          status: false,
          error: result?.message || "AI gagal merespon"
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